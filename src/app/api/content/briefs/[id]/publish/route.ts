import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateMatchScore } from "@/lib/matching";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const { data: brief } = await auth.supabase
      .from("content_briefs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!brief) {
      return NextResponse.json({ error: "Brief introuvable" }, { status: 404 });
    }

    const { data: store } = await auth.supabase
      .from("stores")
      .select("vendor_id")
      .eq("id", brief.store_id)
      .maybeSingle();
    if (store?.vendor_id !== auth.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: creators, error: creatorsError } = await admin
      .from("creator_profiles")
      .select("*")
      .eq("status", "approved");

    if (creatorsError) throw creatorsError;

    const notifications = [];
    for (const creator of creators || []) {
      if (!creator.user_id) continue;
      const match = await calculateMatchScore(creator, brief);
      notifications.push({
        user_id: creator.user_id,
        title: `🎯 Nouvelle mission : ${brief.title}`,
        message:
          match.score >= 60
            ? `Cette mission correspond à votre profil à ${match.score} % !`
            : `Budget ${brief.budget_min ?? brief.budget} - ${brief.budget_max ?? brief.budget} TND. Postulez dès maintenant.`,
        type: "brief_match",
        link: `/creator/opportunities/${id}`,
        payload: { brief_id: id, score: match.score },
        is_read: false,
      });
    }

    if (notifications.length > 0) {
      await admin.from("notifications").insert(notifications);
    }

    return NextResponse.json({ success: true, notifiedCount: notifications.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
