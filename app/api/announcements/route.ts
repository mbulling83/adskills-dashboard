import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ announcements: [] });
    }

    // Get relevant announcements using the database function
    const { data: announcements, error } = await supabase
      .rpc("get_relevant_announcements", {
        p_user_id: user.id
      });

    if (error) {
      console.error("Failed to fetch announcements:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ announcements: announcements || [] });
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
