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

  let body: { skill_name?: string; invoked_at?: string; metadata?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!body.skill_name) {
    return new Response("skill_name required", { status: 400 });
  }

  const { error: insertErr } = await supabase.from("skill_events").insert({
    org_id: tokenRow.org_id,
    skill_name: body.skill_name,
    invoked_at: body.invoked_at ?? new Date().toISOString(),
    metadata: body.metadata ?? null,
  });

  if (insertErr) {
    console.error(insertErr);
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
