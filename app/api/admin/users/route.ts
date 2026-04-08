import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = user.app_metadata as { role?: string };
  if (meta?.role !== "admin") return null;
  return user;
}

// GET: list all users with their org assignment
export async function GET() {
  const caller = await assertAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = adminClient();

  // List all auth users
  const { data: { users: authUsers }, error } = await admin.auth.admin.listUsers({ perPage: 500 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get all org_users mappings
  const { data: orgUsers } = await admin.from("org_users").select("user_id, org_id");
  const { data: orgs } = await admin.from("orgs").select("id, name");

  const orgById = Object.fromEntries((orgs || []).map((o) => [o.id, o]));
  const orgByUser = Object.fromEntries(
    (orgUsers || []).map((ou) => [ou.user_id, orgById[ou.org_id] ?? null])
  );

  const users = authUsers.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    app_metadata: u.app_metadata,
    org: orgByUser[u.id] ?? null,
  }));

  return NextResponse.json({ users });
}

// PATCH: update role or org assignment
export async function PATCH(req: NextRequest) {
  const caller = await assertAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { user_id, role, org_id } = body as {
    user_id: string;
    role?: "admin" | "org";
    org_id?: string | null;
  };

  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const admin = adminClient();

  // Get current app_metadata
  const { data: { user }, error: fetchErr } = await admin.auth.admin.getUserById(user_id);
  if (fetchErr || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const currentMeta = (user.app_metadata as Record<string, string>) || {};

  // Update role if provided
  if (role !== undefined) {
    const newMeta = { ...currentMeta, role };
    const { error } = await admin.auth.admin.updateUserById(user_id, {
      app_metadata: newMeta,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync user_roles table
    await admin.from("user_roles").upsert(
      { user_id, role, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  // Update org assignment if provided
  if (org_id !== undefined) {
    if (org_id === null || org_id === "") {
      // Remove from org
      await admin.from("org_users").delete().eq("user_id", user_id);

      // Strip org_id from app_metadata
      const { org_id: _removed, ...rest } = currentMeta;
      await admin.auth.admin.updateUserById(user_id, { app_metadata: rest });
    } else {
      // Upsert org_users
      await admin
        .from("org_users")
        .upsert({ user_id, org_id }, { onConflict: "user_id" });

      // Stamp org_id into app_metadata
      const newMeta = { ...currentMeta, org_id };
      await admin.auth.admin.updateUserById(user_id, { app_metadata: newMeta });
    }
  }

  return NextResponse.json({ success: true });
}
