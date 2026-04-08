import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Use session user — don't trust body for user_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { announcement_id } = body;

    if (!announcement_id) {
      return NextResponse.json({ error: "announcement_id required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("announcement_views")
      .upsert({
        user_id: user.id,
        announcement_id,
        viewed_at: new Date().toISOString(),
        dismissed_at: new Date().toISOString()
      }, {
        onConflict: "user_id,announcement_id"
      });

    if (error) {
      console.error("Failed to dismiss announcement:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcement dismissal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
