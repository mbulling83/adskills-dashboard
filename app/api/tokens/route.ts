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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { org_id, label } = await request.json();

  const plainToken = `ask_${crypto.randomUUID().replace(/-/g, "")}`;
  const tokenHash = await sha256hex(plainToken);

  const { error } = await supabase.from("api_tokens").insert({
    org_id,
    label: label ?? "Default",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token: plainToken });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { token_id } = await request.json();

  const { error } = await supabase
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", token_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
