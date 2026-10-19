import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ESCROW_METHODS, loadBriefForSeller, notifyAdmins, platformFeePercent } from "@/lib/content-escrow";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const { id: briefId } = await params;
  const { method, reference } = await request.json().catch(() => ({}));

  if (typeof method !== "string" || !(method in ESCROW_METHODS)) {
    return NextResponse.json({ error: "Moyen de paiement invalide" }, { status: 400 });
  }
  const ref = typeof reference === "string" ? reference.trim().slice(0, 120) : "";
  if (ref.length < 3) {
    return NextResponse.json({ error: "Indiquez la référence de votre paiement" }, { status: 400 });
  }

  const loaded = await loadBriefForSeller(briefId, auth.user.id);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { brief } = loaded;

  if (brief.status !== "published" || !brief.selected_creator_id) {
    return NextResponse.json({ error: "Choisissez d'abord un créateur" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin.from("content_payments").select("id").eq("brief_id", briefId).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Un paiement est déjà enregistré pour ce brief" }, { status: 400 });
  }

  const { data: application } = await admin
    .from("content_applications")
    .select("proposed_price")
    .eq("brief_id", briefId)
    .eq("creator_id", brief.selected_creator_id)
    .eq("status", "accepted")
    .maybeSingle();
  const amount = Number(application?.proposed_price ?? brief.budget);
  const fee = await platformFeePercent();
  const commission = Math.round(amount * fee) / 100;

  const { error } = await admin.from("content_payments").insert({
    brief_id: briefId,
    store_id: brief.store_id,
    creator_id: brief.selected_creator_id,
    amount,
    platform_commission: commission,
    creator_amount: Math.round((amount - commission) * 100) / 100,
    payment_method: method,
    transaction_ref: ref,
    status: "escrow",
    escrowed_at: null,
  });
  if (error) return NextResponse.json({ error: "Erreur lors de l'enregistrement du paiement" }, { status: 500 });

  await notifyAdmins(
    "💳 Paiement UGC à vérifier",
    `${ESCROW_METHODS[method as keyof typeof ESCROW_METHODS]} de ${amount.toFixed(2)} TND pour « ${brief.title} » (réf. ${ref}).`,
    "/admin/escrow"
  );

  return NextResponse.json({ success: true });
}
