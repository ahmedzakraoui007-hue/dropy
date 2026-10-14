import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { user, role, supabase } = auth;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { sendNotification } = await import("@/lib/notifications");

    if (role === "admin") {
      const { userId, type, title, message, link, icon, payload, sendEmail } = body;
      if (!userId || !type || !title || !message) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      await sendNotification({
        userId,
        type,
        title,
        message,
        link,
        icon,
        payload,
        sendEmail: sendEmail ?? true,
      });
      return NextResponse.json({ success: true });
    }

    if (body.type === "deliverable_submitted" && body.briefId) {
      const { data: brief } = await supabase
        .from("content_briefs")
        .select("id, title, store_id, selected_creator_id")
        .eq("id", body.briefId)
        .maybeSingle();

      if (!brief || brief.selected_creator_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: store } = await supabase
        .from("stores")
        .select("seller_id")
        .eq("id", brief.store_id)
        .maybeSingle();
      if (!store?.seller_id) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      await sendNotification({
        userId: store.seller_id,
        type: "deliverable_submitted",
        title: "🎥 Livrable soumis !",
        message: `Le créateur a soumis son travail pour la mission : ${brief.title}. Vous avez 48h pour l'examiner.`,
        link: `/seller/content/briefs/${brief.id}`,
        sendEmail: true,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Error in /api/notifications/send:", error);
    return NextResponse.json({ error: "Could not send notification" }, { status: 500 });
  }
}
