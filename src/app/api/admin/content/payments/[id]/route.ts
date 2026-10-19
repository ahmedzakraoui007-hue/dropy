import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { escrowState, notify } from "@/lib/content-escrow";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const { action, reference } = await request.json().catch(() => ({}));

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("content_payments")
    .select("*, brief:content_briefs(id, title, status), store:stores(vendor_id)")
    .eq("id", id)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

  const state = escrowState(payment);
  const now = new Date().toISOString();
  const title = payment.brief?.title || "mission";
  const sellerId = payment.store?.vendor_id;

  if (action === "confirm") {
    if (state !== "verifying") return NextResponse.json({ error: "Ce paiement n'est pas en attente de vérification" }, { status: 400 });
    await admin.from("content_payments").update({ escrowed_at: now }).eq("id", id);
    await admin.from("content_briefs").update({ status: "assigned", updated_at: now }).eq("id", payment.brief_id);
    await admin
      .from("content_applications")
      .update({ status: "rejected" })
      .eq("brief_id", payment.brief_id)
      .eq("status", "pending");
    await notify(
      payment.creator_id,
      "🚀 Mission démarrée",
      `Le paiement pour « ${title} » est sécurisé par Dropy. Vous pouvez commencer !`,
      `/creator/missions/${payment.brief_id}`
    );
    await notify(sellerId, "🔒 Paiement sécurisé", `Votre paiement pour « ${title} » est confirmé. Le créateur commence la mission.`, `/seller/content/briefs/${payment.brief_id}`);
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    if (state !== "verifying") return NextResponse.json({ error: "Ce paiement ne peut pas être rejeté" }, { status: 400 });
    await admin.from("content_payments").delete().eq("id", id);
    await notify(
      sellerId,
      "⚠️ Paiement non reçu",
      `Dropy n'a pas trouvé votre paiement pour « ${title} » (réf. ${payment.transaction_ref}). Vérifiez-le puis déclarez-le à nouveau.`,
      `/seller/content/briefs/${payment.brief_id}`
    );
    return NextResponse.json({ success: true });
  }

  if (action === "payout") {
    const ref = typeof reference === "string" ? reference.trim().slice(0, 120) : "";
    if (state !== "released") return NextResponse.json({ error: "Aucun versement en attente pour ce paiement" }, { status: 400 });
    if (ref.length < 3) return NextResponse.json({ error: "Indiquez la référence du versement" }, { status: 400 });
    await admin.from("content_payments").update({ stripe_transfer_id: ref }).eq("id", id);
    await notify(
      payment.creator_id,
      "💸 Paiement versé",
      `Dropy vous a versé ${Number(payment.creator_amount).toFixed(2)} TND pour « ${title} » (réf. ${ref}).`,
      "/creator/payments",
      "payment_received"
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
