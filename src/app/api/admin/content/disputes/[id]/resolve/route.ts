import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/content-escrow";

const RESOLUTION_LABELS: Record<string, string> = {
  refund_full: "remboursement total du vendeur",
  release_full: "versement total au créateur",
  refund_partial: "partage des fonds",
  release_partial: "partage des fonds",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;
  const { id: disputeId } = await params;

  try {
    const { resolution_type, resolution_notes, refund_amount, released_amount } = await request.json();

    if (!RESOLUTION_LABELS[resolution_type] || !resolution_notes) {
      return NextResponse.json({ error: "Type de résolution et notes obligatoires" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: dispute } = await admin
      .from("content_disputes")
      .select("*, payment:content_payments(*), brief:content_briefs(title)")
      .eq("id", disputeId)
      .maybeSingle();

    if (!dispute) return NextResponse.json({ error: "Litige introuvable" }, { status: 404 });
    if (dispute.status !== "open") return NextResponse.json({ error: "Ce litige est déjà résolu" }, { status: 400 });

    const payment = dispute.payment;
    if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

    const totalAmount = Number(payment.amount);
    let refund = 0;
    let released = 0;

    if (resolution_type === "refund_full") {
      refund = totalAmount;
    } else if (resolution_type === "release_full") {
      released = totalAmount;
    } else {
      refund = Number(refund_amount || 0);
      released = Number(released_amount || 0);
      if (refund < 0 || released < 0 || Math.abs(refund + released - totalAmount) > 0.01) {
        return NextResponse.json({ error: "Le remboursement et le versement doivent totaliser le montant payé" }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const feeRatio = totalAmount > 0 ? Number(payment.platform_commission || 0) / totalAmount : 0;
    const commission = Math.round(released * feeRatio * 100) / 100;

    await admin
      .from("content_disputes")
      .update({
        status: "resolved",
        resolution_type,
        resolution_notes,
        refund_amount: refund,
        released_amount: released,
        resolved_by: auth.user.id,
        resolved_at: now,
      })
      .eq("id", disputeId);

    await admin
      .from("content_payments")
      .update(
        released > 0
          ? { status: "released", is_disputed: false, released_at: now, platform_commission: commission, creator_amount: Math.round((released - commission) * 100) / 100 }
          : { status: "refunded", is_disputed: false }
      )
      .eq("id", payment.id);

    await admin
      .from("content_briefs")
      .update({ status: released > 0 ? "completed" : "cancelled", is_disputed: false, updated_at: now })
      .eq("id", dispute.brief_id);

    const { data: store } = await admin.from("stores").select("vendor_id").eq("id", payment.store_id).maybeSingle();
    const title = dispute.brief?.title || "mission";
    const label = RESOLUTION_LABELS[resolution_type];

    await notify(
      store?.vendor_id,
      "⚖️ Litige résolu",
      `Le litige « ${title} » est résolu (${label}). Montant remboursé : ${refund.toFixed(2)} TND.`,
      `/seller/content/briefs/${dispute.brief_id}`,
      "dispute_resolved"
    );
    await notify(
      payment.creator_id,
      "⚖️ Litige résolu",
      `Le litige « ${title} » est résolu (${label}). Montant attribué : ${released.toFixed(2)} TND.`,
      `/creator/missions/${dispute.brief_id}`,
      "dispute_resolved"
    );

    return NextResponse.json({ success: true, refund, released });
  } catch (error: any) {
    console.error("Dispute resolution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
