/**
 * AdSkills customer agent simulator.
 *
 * Simulates a real customer using the dashboard:
 * - Runs multiple sessions
 * - Invokes skills across advertising platforms
 * - Triggers platform detection
 * - Requests permissions
 * - Generates errors to test alerts
 *
 * Run: npx tsx scripts/agent-simulator.ts
 * Or:  npx tsx scripts/agent-simulator.ts --sessions 5
 */

import { randomBytes } from "crypto";
import { config } from "dotenv";
import { parseArgs } from "util";

config({ path: ".env.test" });

const API_URL = process.env.ADSKILLS_API_URL!;
const API_TOKEN = process.env.ADSKILLS_API_TOKEN!;

if (!API_URL || !API_TOKEN) {
  console.error("Missing .env.test — run: npx tsx scripts/seed-test-account.ts");
  process.exit(1);
}

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: { sessions: { type: "string", default: "3" } },
});
const NUM_SESSIONS = parseInt(args.sessions as string, 10);

// ─── Realistic skill library ──────────────────────────────────────────────────

const SKILL_SCENARIOS = [
  {
    name: "google-ads-campaign-management",
    platform: "google_ads",
    metadata: {
      endpoint: "https://googleads.googleapis.com/v14/customers",
      customer_id: "1234567890",
      operation: "create_campaign",
    },
    successRate: 0.9,
    permissions: ["api_call", "file_write"],
  },
  {
    name: "google-ads-reporting",
    platform: "google_ads",
    metadata: {
      endpoint: "googleads.googleapis.com/reports",
      campaign_id: "987654321",
      report_type: "CAMPAIGN_PERFORMANCE",
    },
    successRate: 0.95,
    permissions: ["api_call", "file_read"],
  },
  {
    name: "meta-ads-campaign-management",
    platform: "meta_ads",
    metadata: {
      api: "graph.facebook.com/v18.0",
      adaccount: "act_1234567890",
      operation: "update_budget",
    },
    successRate: 0.85,
    permissions: ["api_call", "file_write"],
  },
  {
    name: "meta-ads-creative",
    platform: "meta_ads",
    metadata: {
      api: "graph.facebook.com/v18.0/adcreatives",
      facebook_marketing: "creative_upload",
      file_size_mb: 4.2,
    },
    successRate: 0.8,
    permissions: ["file_read", "api_call"],
  },
  {
    name: "tiktok-ads-campaign-management",
    platform: "tiktok_ads",
    metadata: {
      endpoint: "https://ads.tiktok.com/open_api/v1.3/campaign",
      advertiser_id: "7201234567890",
      operation: "create",
    },
    successRate: 0.88,
    permissions: ["api_call"],
  },
  {
    name: "keyword-research",
    platform: null,
    metadata: {
      query: "best running shoes 2026",
      sources: ["google_trends", "semrush"],
    },
    successRate: 0.97,
    permissions: ["api_call", "file_write"],
  },
  {
    name: "ad-copy-generator",
    platform: null,
    metadata: {
      product: "protein supplement",
      tone: "energetic",
      platforms: ["google", "meta"],
    },
    successRate: 0.93,
    permissions: ["file_write"],
  },
  {
    name: "cross-platform-analytics",
    platform: "google_ads",
    metadata: {
      customer_id: "1234567890",
      adaccount: "act_1234567890",
      date_range: "last_30_days",
    },
    successRate: 0.87,
    permissions: ["api_call", "database_query"],
  },
  {
    name: "budget-optimizer",
    platform: "google_ads",
    metadata: {
      campaign_id: "111222333",
      ad_group_id: "444555666",
      strategy: "target_roas",
    },
    successRate: 0.75, // higher error rate → triggers alerts
    permissions: ["api_call", "bash_execute"],
  },
  {
    name: "audience-builder",
    platform: "meta_ads",
    metadata: {
      meta_ads: "custom_audience",
      size: 500000,
      source: "customer_list",
    },
    successRate: 0.92,
    permissions: ["file_read", "api_call"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomId() {
  return randomBytes(8).toString("hex");
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callFunction(fnName: string, body: unknown) {
  const res = await fetch(`${API_URL}/${fnName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${fnName} ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Session simulation ───────────────────────────────────────────────────────

async function runSession(sessionNum: number) {
  const sessionId = `sim_${randomId()}`;
  const numSkills = Math.floor(Math.random() * 6) + 3; // 3–8 skills per session
  const skills = pickN(SKILL_SCENARIOS, numSkills);

  console.log(`\n  Session ${sessionNum} (${sessionId})`);
  console.log(`  Skills: ${skills.map((s) => s.name).join(", ")}`);

  const events: any[] = [];

  for (const skill of skills) {
    const success = Math.random() < skill.successRate;
    const status = success ? "success" : "error";

    // Skill invocation event
    events.push({
      type: "skill_invocation",
      timestamp: new Date().toISOString(),
      skill_name: skill.name,
      status,
      metadata: skill.metadata,
      error_message: success ? undefined : `Failed to execute ${skill.name}: timeout`,
    });

    // Tool use events for each permission
    for (const perm of skill.permissions) {
      events.push({
        type: "tool_use",
        timestamp: new Date().toISOString(),
        tool_name: perm,
        skill_name: skill.name,
        status: success ? "success" : "blocked",
        metadata: { permission_type: perm },
      });
    }

    // Occasionally request elevated permissions
    if (Math.random() < 0.3) {
      const riskyPerm = pick(["bash_execute", "file_delete", "git_push", "database_write"]);
      events.push({
        type: "permission_request",
        timestamp: new Date().toISOString(),
        tool_name: riskyPerm,
        status: "pending",
        metadata: {
          skill: skill.name,
          reason: `${skill.name} requires ${riskyPerm} to complete operation`,
          risk_level: ["bash_execute", "file_delete"].includes(riskyPerm) ? "high" : "critical",
        },
      });
    }

    process.stdout.write(success ? "." : "✗");
    await sleep(50);
  }

  console.log();

  // Send events in one batch
  try {
    const result = await callFunction("track-session", {
      session_id: sessionId,
      events,
      session_end: true,
    });
    console.log(
      `  ✓ Tracked ${result.events_processed} events, ` +
        `detected: [${result.tools_detected.map((d: any) => d.platform).join(", ") || "none"}]`
    );
  } catch (err: any) {
    console.error(`  ✗ track-session failed: ${err.message}`);
  }

  return sessionId;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`AdSkills Agent Simulator`);
  console.log(`Running ${NUM_SESSIONS} sessions against ${API_URL}\n`);

  const sessionIds: string[] = [];

  for (let i = 1; i <= NUM_SESSIONS; i++) {
    const id = await runSession(i);
    sessionIds.push(id);
    await sleep(500);
  }

  // Generate AI suggestions based on the sessions
  console.log("\nGenerating AI suggestions...");
  try {
    const suggestions = await callFunction("generate-suggestions", {});
    console.log(`✓ Generated ${suggestions.generated} suggestions`);
  } catch (err: any) {
    console.error(`✗ generate-suggestions failed: ${err.message}`);
  }

  // Test a few permissions
  console.log("\nRunning permission tests...");
  try {
    const tests = await callFunction("test-permission", {
      permissions: [
        {
          permission_type: "file_write",
          tool_name: "ad-copy-generator",
          test_data: { files: ["/tmp/ad_copy.txt"] },
          expected_impact: { modification: true },
        },
        {
          permission_type: "bash_execute",
          tool_name: "budget-optimizer",
          test_data: { commands: ["python optimize.py --dry-run"] },
          expected_impact: { execution: true },
        },
        {
          permission_type: "api_call",
          tool_name: "google-ads-reporting",
          test_data: { endpoints: ["https://googleads.googleapis.com/v14/reports"] },
          expected_impact: { external_call: true },
        },
      ],
    });
    console.log(
      `✓ Tested ${tests.tested} permissions: ` +
        tests.results.map((r: any) => `${r.permission}=${r.result}`).join(", ")
    );
  } catch (err: any) {
    console.error(`✗ test-permission failed: ${err.message}`);
  }

  // Build a session replay for the first session
  if (sessionIds.length > 0) {
    console.log("\nCreating session replay...");
    try {
      const replay = await callFunction("session-replay", {
        session_id: sessionIds[0],
        create_replay: true,
      });
      if (replay.replay_data) {
        console.log(
          `✓ Replay created — ${replay.events_processed} events, ` +
            `success rate: ${replay.replay_data.metrics.success_rate.toFixed(1)}%`
        );
      } else {
        console.log(`  (No events found for first session yet)`);
      }
    } catch (err: any) {
      console.error(`✗ session-replay failed: ${err.message}`);
    }
  }

  console.log("\n✓ Simulation complete. Check the dashboard:");
  console.log("  /dashboard/analytics  — session telemetry & platform detections");
  console.log("  /dashboard/insights   — AI suggestions, alerts & skill metrics");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
