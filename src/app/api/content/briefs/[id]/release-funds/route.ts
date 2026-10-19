import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBriefForSeller, notify, notifyAdmins } from "@/lib/content-escrow";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const { id: briefId } = await params;

  const loaded = await loadBriefForSeller(briefId, auth.user.id);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { brief } = loaded;

  if (brief.status !== "delivered" || brief.is_disputed) {
    return NextResponse.json({ error: "Aucune livraison à valider" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: payment } = await admin.from("content_payments").select("*").eq("brief_id", briefId).maybeSingle();
  if (!payment || payment.status !== "escrow" || !payment.escrowed_at) {
    return NextResponse.json({ error: "Aucun paiement sécurisé pour ce brief" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await admin.from("content_payments").update({ status: "released", released_at: now }).eq("id", payment.id);
  await admin.from("content_briefs").update({ status: "completed", updated_at: now }).eq("id", briefId);

  const { data: delivery } = await admin
    .from("content_deliveries")
    .select("id, files")
    .eq("brief_id", briefId)
    .order("delivered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (delivery) {
    await admin.from("content_deliveries").update({ status: "approved", approved_at: now }).eq("id", delivery.id);
    const files = Array.isArray(delivery.files) ? delivery.files : [];
    if (files.length) {
      await admin.from("content_library").insert(
        files.map((file: { url: string; type?: string; filename?: string; size?: number }) => ({
          store_id: brief.store_id,
          brief_id: briefId,
          file_url: file.url,
          file_type: file.type?.startsWith("video/") ? "video" : "image",
          filename: file.filename || null,
          file_size: file.size || null,
          tags: [brief.content_type].filter(Boolean),
        }))
      );
    }
  }

  const { data: creator } = await admin
    .from("creator_profiles")
    .select("id, total_projects, total_earned")
    .eq("user_id", payment.creator_id)
    .maybeSingle();
  if (creator) {
    await admin
      .from("creator_profiles")
      .update({
        total_projects: (creator.total_projects || 0) + 1,
        total_earned: Number(creator.total_earned || 0) + Number(payment.creator_amount || 0),
      })
      .eq("id", creator.id);
  }

  await notify(
    payment.creator_id,
    "💰 Paiement validé !",
    `Le vendeur a validé « ${brief.title} ». Votre paiement de ${Number(payment.creator_amount).toFixed(2)} TND va être versé par Dropy.`,
    "/creator/payments",
    "payment_received"
  );
  await notifyAdmins(
    "💸 Versement créateur à effectuer",
    `${Number(payment.creator_amount).toFixed(2)} TND à verser pour « ${brief.title} ».`,
    "/admin/escrow"
  );

  return NextResponse.json({ success: true });
}
