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

interface SessionEvent {
  id: string;
  event_type: string;
  timestamp: string;
  skill_name?: string;
  tool_name?: string;
  metadata?: any;
  error_message?: string;
  status?: string;
}

interface ReplayData {
  session_id: string;
  session_info: any;
  events: SessionEvent[];
  timeline: any[];
  snapshots: any[];
  metrics: any;
}

async function buildTimeline(events: SessionEvent[]) {
  const timeline = [];
  let currentTime = 0;

  for (const event of events) {
    const eventTimestamp = new Date(event.timestamp).getTime();
    if (timeline.length === 0) {
      currentTime = eventTimestamp;
    }

    const timeOffset = eventTimestamp - currentTime;

    timeline.push({
      time: timeOffset,
      timestamp: event.timestamp,
      event_type: event.event_type,
      description: getEventDescription(event),
      data: {
        skill_name: event.skill_name,
        tool_name: event.tool_name,
        status: event.status,
        error: event.error_message,
        metadata: event.metadata
      },
      severity: getEventSeverity(event)
    });
  }

  return timeline;
}

function getEventDescription(event: SessionEvent): string {
  switch (event.event_type) {
    case "skill_invocation":
      return event.status === "success"
        ? `Successfully invoked skill: ${event.skill_name}`
        : `Failed to invoke skill: ${event.skill_name}`;
    case "tool_use":
      return `Used tool: ${event.tool_name}`;
    case "permission_request":
      return `Requested permission: ${event.tool_name}`;
    case "error":
      return `Error: ${event.error_message}`;
    default:
      return `Event: ${event.event_type}`;
  }
}

function getEventSeverity(event: SessionEvent): string {
  if (event.event_type === "error" || event.status === "error") {
    return "error";
  }
  if (event.event_type === "permission_request") {
    return "warning";
  }
  return "info";
}

async function captureSnapshots(events: SessionEvent[]) {
  const snapshots = [];
  const snapshotPoints = [0, Math.floor(events.length / 2), events.length - 1];

  for (const index of snapshotPoints) {
    const event = events[index];
    if (!event) continue;

    const priorEvents = events.slice(0, index + 1);
    const snapshot = {
      timestamp: event.timestamp,
      event_index: index,
      state: {
        total_events: index + 1,
        successful_invocations: priorEvents.filter(e =>
          e.event_type === "skill_invocation" && e.status === "success"
        ).length,
        failed_invocations: priorEvents.filter(e =>
          e.event_type === "skill_invocation" && e.status === "error"
        ).length,
        permissions_requested: priorEvents.filter(e =>
          e.event_type === "permission_request"
        ).length,
        tools_used: [...new Set(priorEvents
          .filter(e => e.tool_name)
          .map(e => e.tool_name)
        )]
      },
      context: {
        last_skill: event.skill_name,
        last_tool: event.tool_name,
        last_status: event.status
      }
    };

    snapshots.push(snapshot);
  }

  return snapshots;
}

async function calculateMetrics(events: SessionEvent[]) {
  const skillInvocations = events.filter(e => e.event_type === "skill_invocation");
  const successful = skillInvocations.filter(e => e.status === "success");
  const failed = skillInvocations.filter(e => e.status === "error");

  const skillBreakdown = skillInvocations.reduce((acc, event) => {
    const skill = event.skill_name || "unknown";
    if (!acc[skill]) {
      acc[skill] = { total: 0, success: 0, failed: 0 };
    }
    acc[skill].total++;
    if (event.status === "success") acc[skill].success++;
    if (event.status === "error") acc[skill].failed++;
    return acc;
  }, {} as Record<string, { total: number; success: number; failed: number }>);

  const permissionRequests = events.filter(e => e.event_type === "permission_request");
  const toolUsage = events.filter(e => e.tool_name).map(e => e.tool_name);

  return {
    total_events: events.length,
    skill_invocations: skillInvocations.length,
    success_rate: skillInvocations.length > 0
      ? (successful.length / skillInvocations.length) * 100
      : 0,
    skill_breakdown: skillBreakdown,
    permissions_requested: permissionRequests.length,
    unique_tools_used: [...new Set(toolUsage)].length,
    total_tools_used: toolUsage.length,
    duration_ms: events.length > 0
      ? new Date(events[events.length - 1].timestamp).getTime() -
        new Date(events[0].timestamp).getTime()
      : 0
  };
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

  let body: {
    session_id?: string;
    create_replay?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!body.session_id) {
    return new Response("session_id required", { status: 400 });
  }

  // Get session info
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_id", body.session_id)
    .single();

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  // Check authorization
  if (session.org_id !== tokenRow.org_id) {
    return new Response("Forbidden", { status: 403 });
  }

  // Get all session events
  const { data: events } = await supabase
    .from("session_events")
    .select("*")
    .eq("session_id", session.id)
    .order("timestamp", { ascending: true });

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({
      session_id: body.session_id,
      replay_data: null,
      message: "No events found for this session"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build replay data
  const timeline = await buildTimeline(events);
  const snapshots = await captureSnapshots(events);
  const metrics = await calculateMetrics(events);

  const replayData: ReplayData = {
    session_id: body.session_id,
    session_info: session,
    events: events as SessionEvent[],
    timeline,
    snapshots,
    metrics
  };

  // Save replay data if requested
  let replayRecord = null;
  if (body.create_replay) {
    const { data: newReplay } = await supabase
      .from("session_replays")
      .insert({
        session_id: session.id,
        org_id: tokenRow.org_id,
        replay_data: replayData,
        snapshot_data: snapshots,
        annotations: {}
      })
      .select()
      .single();

    replayRecord = newReplay;
  }

  return new Response(JSON.stringify({
    session_id: body.session_id,
    replay_data: replayData,
    replay_record: replayRecord,
    events_processed: events.length,
    timeline_entries: timeline.length,
    snapshots: snapshots.length
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
