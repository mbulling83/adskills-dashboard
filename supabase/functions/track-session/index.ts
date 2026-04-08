import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Platform detection patterns for advertising tools
const PLATFORM_PATTERNS = {
  google_ads: {
    patterns: [
      /googleads/i,
      /adwords/i,
      /google\.apis\.com\/ads/i,
      /googleads.googleapis\.com/i,
      /customer_id/i,
      /campaign_id/i,
      /ad_group_id/i
    ],
    skills: ["google-ads-campaign-management", "google-ads-reporting", "google-ads-bidding"],
    confidence: "high"
  },
  meta_ads: {
    patterns: [
      /facebook\.com\/ads/i,
      /graph\.facebook\.com/i,
      /meta.*ads/i,
      /facebook.*marketing/i,
      /adaccount/i,
      /campaign_id/i
    ],
    skills: ["meta-ads-campaign-management", "meta-ads-creative", "meta-ads-audience-insights"],
    confidence: "high"
  },
  tiktok_ads: {
    patterns: [
      /tiktok.*ads/i,
      /ads\.tiktok\.com/i,
      /advertiser_id/i,
      /tiktok_campaign/i
    ],
    skills: ["tiktok-ads-campaign-management", "tiktok-ads-creative", "tiktok-ads-targeting"],
    confidence: "high"
  },
  linkedin_ads: {
    patterns: [
      /linkedin.*ads/i,
      /api\.linkedin\.com.*ad/i,
      /linkedin_campaign/i
    ],
    skills: ["linkedin-ads-campaign-management", "linkedin-ads-audience-network"],
    confidence: "high"
  }
};

// Permission risk classification
const PERMISSION_RISK_LEVELS = {
  // Low risk: read operations
  file_read: { risk: "low", impact: "readonly" },
  environment_read: { risk: "low", impact: "readonly" },

  // Medium risk: write operations to controlled areas
  file_write: { risk: "medium", impact: "data_modification" },
  api_call: { risk: "medium", impact: "external_access" },
  database_query: { risk: "medium", impact: "data_access" },

  // High risk: system-level operations
  bash_execute: { risk: "high", impact: "system_execution" },
  network_request: { risk: "high", impact: "external_access" },

  // Critical risk: destructive operations
  file_delete: { risk: "critical", impact: "data_destruction" },
  git_push: { risk: "critical", impact: "code_deployment" },
  database_write: { risk: "critical", impact: "data_modification" }
};

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function detectPlatforms(event: any): Array<{ name: string; confidence: string; evidence: any }> {
  const detections = [];
  const text = JSON.stringify(event);

  for (const [platform, config] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        detections.push({
          name: platform,
          confidence: config.confidence,
          evidence: {
            matched_pattern: pattern.toString(),
            context: event
          }
        });
        break;
      }
    }
  }

  return detections;
}

function classifyPermissionRisk(toolName: string, permissionType: string): { risk: string; impact: string } {
  const key = `${toolName}_${permissionType}` as keyof typeof PERMISSION_RISK_LEVELS;
  if (key in PERMISSION_RISK_LEVELS) {
    return PERMISSION_RISK_LEVELS[key];
  }

  const directKey = permissionType as keyof typeof PERMISSION_RISK_LEVELS;
  if (directKey in PERMISSION_RISK_LEVELS) {
    return PERMISSION_RISK_LEVELS[directKey];
  }

  return { risk: "medium", impact: "unknown" };
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

  // Look up token
  const { data: tokenRow, error: tokenErr } = await supabase
    .from("api_tokens")
    .select("id, org_id, revoked_at")
    .eq("token_hash", tokenHash)
    .single();

  if (tokenErr || !tokenRow) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (tokenRow.revoked_at) {
    return new Response("Token revoked", { status: 403 });
  }

  let body: {
    session_id?: string;
    events?: Array<{
      type: string;
      timestamp?: string;
      skill_name?: string;
      tool_name?: string;
      metadata?: unknown;
      error_message?: string;
      status?: string;
    }>;
    session_end?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!body.session_id) {
    return new Response("session_id required", { status: 400 });
  }

  if (!body.events || body.events.length === 0) {
    return new Response("events required", { status: 400 });
  }

  // Get or create session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_id", body.session_id)
    .single();

  let sessionId = session?.id;

  if (!sessionId) {
    const { data: newSession } = await supabase
      .from("sessions")
      .insert({
        org_id: tokenRow.org_id,
        session_id: body.session_id,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    sessionId = newSession?.id;
  }

  if (!sessionId) {
    return new Response("Failed to create session", { status: 500 });
  }

  // Process events
  const results = {
    session_id: sessionId,
    events_processed: 0,
    tools_detected: [] as Array<{ platform: string; suggested_skills: string[] }>,
    permission_analyzed: 0,
    errors: [] as string[]
  };

  for (const event of body.events) {
    // Insert session event
    const { error: eventError } = await supabase
      .from("session_events")
      .insert({
        session_id: sessionId,
        event_type: event.type,
        timestamp: event.timestamp || new Date().toISOString(),
        skill_name: event.skill_name,
        tool_name: event.tool_name,
        metadata: event.metadata || null,
        error_message: event.error_message,
        status: event.status
      });

    if (eventError) {
      console.error("Failed to insert event:", eventError);
      results.errors.push(`Failed to insert event: ${eventError.message}`);
      continue;
    }

    results.events_processed++;

    // Tool detection for skill invocations
    if (event.type === "skill_invocation" && event.metadata) {
      const detections = detectPlatforms(event.metadata);

      for (const detection of detections) {
        const platformConfig = PLATFORM_PATTERNS[
          detection.name as keyof typeof PLATFORM_PATTERNS
        ];

        const { error: detectionError } = await supabase
          .from("tool_detections")
          .insert({
            org_id: tokenRow.org_id,
            session_id: sessionId,
            platform_name: detection.name,
            detected_at: new Date().toISOString(),
            confidence: detection.confidence,
            evidence: detection.evidence,
            suggested_skills: platformConfig.skills,
            status: "pending"
          });

        if (!detectionError) {
          results.tools_detected.push({
            platform: detection.name,
            suggested_skills: platformConfig.skills
          });
        }
      }
    }

    // Permission analysis
    if (event.type === "permission_request" && event.tool_name) {
      const risk = classifyPermissionRisk(event.tool_name, event.metadata as any as string);

      const { error: permError } = await supabase
        .from("permission_requests")
        .insert({
          org_id: tokenRow.org_id,
          session_id: sessionId,
          permission_type: event.tool_name,
          tool_name: event.metadata as any as string,
          risk_level: risk.risk,
          requested_at: event.timestamp || new Date().toISOString(),
          evidence: {
            session_context: event.metadata,
            risk_classification: risk
          },
          decision: "pending"
        });

      if (!permError) {
        results.permission_analyzed++;
      }

      // Track permission usage patterns
      const { data: existingUsage } = await supabase
        .from("permission_usage")
        .select("*")
        .eq("org_id", tokenRow.org_id)
        .eq("permission_type", event.tool_name)
        .single();

      if (existingUsage) {
        await supabase
          .from("permission_usage")
          .update({
            last_used_at: new Date().toISOString(),
            usage_count: existingUsage.usage_count + 1
          })
          .eq("id", existingUsage.id);
      } else {
        await supabase
          .from("permission_usage")
          .insert({
            org_id: tokenRow.org_id,
            permission_type: event.tool_name,
            tool_name: event.metadata as any as string,
            risk_level: risk.risk,
            actual_impact: { risk_analysis: risk }
          });
      }
    }
  }

  // Update session if ending
  if (body.session_end && sessionId) {
    const { data: events } = await supabase
      .from("session_events")
      .select("status")
      .eq("session_id", sessionId);

    const totalInvocations = events?.filter(e => e.status === "success").length || 0;
    const totalErrors = events?.filter(e => e.status === "error").length || 0;

    await supabase
      .from("sessions")
      .update({
        ended_at: new Date().toISOString(),
        total_invocations: totalInvocations,
        total_errors: totalErrors
      })
      .eq("id", sessionId);
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
