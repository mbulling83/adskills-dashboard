import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { user_id, announcement_id } = body;

    if (!user_id || !announcement_id) {
      return NextResponse.json(
        { error: "user_id and announcement_id required" },
        { status: 400 }
      );
    }

    // Record announcement dismissal
    const { error } = await supabase
      .from("announcement_views")
      .upsert({
        user_id,
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
