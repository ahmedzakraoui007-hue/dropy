import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateMatchScore } from "@/lib/matching";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: brief, error: briefError } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", id)
      .single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("seller_id")
      .eq("id", brief.store_id)
      .maybeSingle();
    if (store?.seller_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Get all approved creators
    const { data: creators, error: creatorsError } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("status", "approved");

    if (creatorsError) throw creatorsError;

    // 3. Calculate scores and notify top matches
    const notifications = [];
    for (const creator of creators) {
      const match = await calculateMatchScore(creator, brief);
      if (match.score >= 60) {
        notifications.push({
          user_id: creator.user_id,
          title: "🎯 New Match: " + brief.title,
          message: `This mission matches your profile by ${match.score}%!`,
          type: "brief_match",
          link: `/creator/opportunities/${id}`,
          metadata: { brief_id: id, score: match.score }
        });
      }
    }

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json({ success: true, notifiedCount: notifications.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
