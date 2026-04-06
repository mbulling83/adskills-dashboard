import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getRoleFromToken(accessToken: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString()
    );
    return payload.role ?? null;
  } catch {
    return null;
  }
}

async function requireAdmin(): Promise<
  { error: NextResponse } | { error: null }
> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = getRoleFromToken(session.access_token);
  if (role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { error: null };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const { org_id, label } = await request.json();

  if (!org_id) {
    return NextResponse.json({ error: "org_id required" }, { status: 400 });
  }

  // Verify org exists
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id")
    .eq("id", org_id)
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  const plainToken = `ask_${crypto.randomUUID().replace(/-/g, "")}`;
  const tokenHash = await sha256hex(plainToken);

  const { error } = await supabase.from("api_tokens").insert({
    org_id,
    label: label ?? "Default",
    token_hash: tokenHash,
  });

  if (error) {
    console.error("Token insert error:", error.code);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }

  return NextResponse.json({ token: plainToken });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const { token_id } = await request.json();

  if (!token_id) {
    return NextResponse.json({ error: "token_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", token_id);

  if (error) {
    console.error("Token revoke error:", error.code);
    return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
