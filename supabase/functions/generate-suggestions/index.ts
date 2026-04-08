import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface SuggestionContext {
  org_id: string;
  recent_sessions: any[];
  detected_platforms: string[];
  permission_requests: any[];
  skill_metrics: any[];
}

async function generateSuggestions(context: SuggestionContext) {
  const suggestions = [];

  // 1. Skill suggestions based on detected platforms
  const platformsWithoutSkills = new Set();
  for (const platform of context.detected_platforms) {
    const hasSkillForPlatform = context.skill_metrics.some(
      m => m.skill_name.includes(platform.replace("_", "-"))
    );

    if (!hasSkillForPlatform) {
      platformsWithoutSkills.add(platform);
    }
  }

  for (const platform of platformsWithoutSkills) {
    const skills: Record<string, string[]> = {
      google_ads: ["google-ads-campaign-management", "google-ads-reporting"],
      meta_ads: ["meta-ads-campaign-management", "meta-ads-creative"],
      tiktok_ads: ["tiktok-ads-campaign-management", "tiktok-ads-targeting"],
      linkedin_ads: ["linkedin-ads-campaign-management"]
    };

    suggestions.push({
      suggestion_type: "skill_enable",
      title: `Enable ${platform.replace("_", " ")} skills`,
      description: `We detected ${platform.replace("_", " ")} API usage but no skills are enabled for this platform.`,
      evidence: {
        platform,
        detection_count: context.detected_platforms.filter(p => p === platform).length
      },
      suggested_actions: skills[platform] || []
    });
  }

  // 2. Permission grant suggestions based on safe usage patterns
  const safePermissions = new Map();
  for (const perm of context.permission_requests) {
    if (perm.decision === "pending" && perm.risk_level === "low") {
      const usageCount = safePermissions.get(perm.permission_type) || 0;
      safePermissions.set(perm.permission_type, usageCount + 1);
    }
  }

  for (const [permission, count] of safePermissions.entries()) {
    if (count >= 3) { // Suggest if safely requested 3+ times
      suggestions.push({
        suggestion_type: "permission_grant",
        title: `Consider granting ${permission}`,
        description: `This permission has been requested ${count} times with low risk. Consider approving it permanently.`,
        evidence: {
          permission,
          request_count: count,
          risk_level: "low"
        },
        suggested_actions: [
          { action: "grant_permission", permission, duration: "permanent" }
        ]
      });
    }
  }

  // 3. Workflow optimization suggestions
  const skillUsagePatterns = new Map();
  for (const session of context.recent_sessions) {
    const { data: events } = await supabase
      .from("session_events")
      .select("skill_name")
      .eq("session_id", session.id)
      .eq("event_type", "skill_invocation");

    if (events) {
      const skills = events.map(e => e.skill_name);
      skillUsagePatterns.set(session.id, skills);
    }
  }

  // Find patterns where skills are used together
  const skillPairs = new Map<string, number>();
  const skillList = Array.from(skillUsagePatterns.values()).flat();

  for (let i = 0; i < skillList.length - 1; i++) {
    const pair = [skillList[i], skillList[i + 1]].sort().join(" + ");
    skillPairs.set(pair, (skillPairs.get(pair) || 0) + 1);
  }

  for (const [pair, count] of skillPairs.entries()) {
    if (count >= 5) { // Suggest if used together 5+ times
      suggestions.push({
        suggestion_type: "workflow_optimization",
        title: `Create workflow for ${pair}`,
        description: `These skills are frequently used together (${count} times). Consider creating a combined workflow.`,
        evidence: {
          skills: pair.split(" + "),
          usage_count: count
        },
        suggested_actions: [
          { action: "create_workflow", name: `${pair} workflow`, skills: pair.split(" + ") }
        ]
      });
    }
  }

  // 4. Error reduction suggestions
  const failingSkills = context.skill_metrics.filter(m =>
    m.success_rate < 80 && m.total_invocations > 5
  );

  for (const skill of failingSkills) {
    suggestions.push({
      suggestion_type: "workflow_optimization",
      title: `Review ${skill.skill_name} configuration`,
      description: `This skill has a ${skill.success_rate.toFixed(1)}% success rate. Consider reviewing its configuration or permissions.`,
      evidence: {
        skill: skill.skill_name,
        success_rate: skill.success_rate,
        total_invocations: skill.total_invocations,
        error_types: skill.error_types
      },
      suggested_actions: [
        { action: "review_skill", skill: skill.skill_name },
        { action: "check_permissions", skill: skill.skill_name },
        { action: "view_error_logs", skill: skill.skill_name }
      ]
    });
  }

  return suggestions;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const plainToken = authHeader.slice(7);
  const tokenHash = await sha256hex(plainToken);

  const { data: tokenRow } = await supabase
    .from("api_tokens")
    .select("id, org_id, revoked_at")
    .eq("token_hash", tokenHash)
    .single();

  if (!tokenRow || tokenRow.revoked_at) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Gather context for suggestions
  const recentSessions = await supabase
    .from("sessions")
    .select("*")
    .eq("org_id", tokenRow.org_id)
    .order("started_at", { ascending: false })
    .limit(20);

  const { data: detectedPlatforms } = await supabase
    .from("tool_detections")
    .select("platform_name")
    .eq("org_id", tokenRow.org_id)
    .eq("status", "pending");

  const { data: permissionRequests } = await supabase
    .from("permission_requests")
    .select("*")
    .eq("org_id", tokenRow.org_id)
    .order("requested_at", { ascending: false })
    .limit(50);

  const { data: skillMetrics } = await supabase
    .from("skill_metrics")
    .select("*")
    .eq("org_id", tokenRow.org_id)
    .order("total_invocations", { ascending: false });

  const context: SuggestionContext = {
    org_id: tokenRow.org_id,
    recent_sessions: recentSessions.data || [],
    detected_platforms: detectedPlatforms?.map(p => p.platform_name) || [],
    permission_requests: permissionRequests || [],
    skill_metrics: skillMetrics || []
  };

  const suggestions = await generateSuggestions(context);

  // Insert suggestions into database
  const inserted = [];
  for (const suggestion of suggestions) {
    const { data } = await supabase
      .from("suggestions")
      .insert({
        org_id: tokenRow.org_id,
        suggestion_type: suggestion.suggestion_type,
        title: suggestion.title,
        description: suggestion.description,
        evidence: suggestion.evidence,
        suggested_actions: suggestion.suggested_actions
      })
      .select()
      .single();

    if (data) inserted.push(data);
  }

  return new Response(JSON.stringify({
    generated: inserted.length,
    suggestions: inserted
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
