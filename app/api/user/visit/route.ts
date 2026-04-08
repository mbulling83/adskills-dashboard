import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();

    // Use the authenticated session user — don't trust body
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("user_visits")
      .upsert({
        user_id: user.id,
        visited_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });

    if (error) {
      console.error("Failed to record visit:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Visit recording error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
