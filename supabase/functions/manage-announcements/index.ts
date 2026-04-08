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

interface Announcement {
  title: string;
  message: string;
  announcement_type: string;
  severity?: string;
  icon?: string;
  action_url?: string;
  action_label?: string;
  featured?: boolean;
  valid_from?: string;
  valid_until?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const plainToken = authHeader.slice(7);
  const tokenHash = await sha256hex(plainToken);

  // Verify token and get org
  const { data: tokenRow } = await supabase
    .from("api_tokens")
    .select("id, org_id, revoked_at")
    .eq("token_hash", tokenHash)
    .single();

  if (!tokenRow || tokenRow.revoked_at) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const announcementId = url.pathname.split("/").pop();

  // GET: Fetch announcements
  if (req.method === "GET") {
    // If fetching specific announcement
    if (announcementId && announcementId !== "manage-announcements") {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", announcementId)
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 404 });
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all active announcements
    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ announcements }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST: Create new announcement
  if (req.method === "POST") {
    const body: Announcement = await req.json();

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: body.title,
        message: body.message,
        announcement_type: body.announcement_type,
        severity: body.severity || "info",
        icon: body.icon,
        action_url: body.action_url,
        action_label: body.action_label,
        featured: body.featured || false,
        valid_from: body.valid_from || new Date().toISOString(),
        valid_until: body.valid_until,
        metadata: body.metadata || {}
      })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // PUT: Update announcement
  if (req.method === "PUT") {
    if (!announcementId || announcementId === "manage-announcements") {
      return new Response("Announcement ID required", { status: 400 });
    }

    const body: Partial<Announcement> = await req.json();

    const { data, error } = await supabase
      .from("announcements")
      .update({
        title: body.title,
        message: body.message,
        announcement_type: body.announcement_type,
        severity: body.severity,
        icon: body.icon,
        action_url: body.action_url,
        action_label: body.action_label,
        featured: body.featured,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
        metadata: body.metadata,
        active: body.active
      })
      .eq("id", announcementId)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // DELETE: Deactivate announcement
  if (req.method === "DELETE") {
    if (!announcementId || announcementId === "manage-announcements") {
      return new Response("Announcement ID required", { status: 400 });
    }

    const { data, error } = await supabase
      .from("announcements")
      .update({ active: false })
      .eq("id", announcementId)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
});
