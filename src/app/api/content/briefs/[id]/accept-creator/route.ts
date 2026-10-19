import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { escrowPaymentDetails, loadBriefForSeller, notify } from "@/lib/content-escrow";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const { id: briefId } = await params;
  const { applicationId } = await request.json().catch(() => ({}));
  if (!applicationId) return NextResponse.json({ error: "Candidature manquante" }, { status: 400 });

  const loaded = await loadBriefForSeller(briefId, auth.user.id);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { brief } = loaded;

  if (brief.status !== "published" || brief.selected_creator_id) {
    return NextResponse.json({ error: "Un créateur a déjà été choisi pour ce brief" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: application } = await admin
    .from("content_applications")
    .select("id, creator_id, proposed_price, status")
    .eq("id", applicationId)
    .eq("brief_id", briefId)
    .maybeSingle();
  if (!application || application.status !== "pending") {
    return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
  }

  await admin.from("content_applications").update({ status: "accepted" }).eq("id", application.id);
  await admin
    .from("content_briefs")
    .update({ selected_creator_id: application.creator_id, updated_at: new Date().toISOString() })
    .eq("id", briefId);

  await notify(
    application.creator_id,
    "🎉 Candidature retenue",
    `Votre candidature pour « ${brief.title} » a été retenue. La mission démarrera dès que le paiement du vendeur sera sécurisé par Dropy.`,
    `/creator/missions/${briefId}`
  );

  return NextResponse.json({
    success: true,
    amount: Number(application.proposed_price),
    paymentDetails: await escrowPaymentDetails(),
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const { id: briefId } = await params;

  const loaded = await loadBriefForSeller(briefId, auth.user.id);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { brief } = loaded;

  const admin = createAdminClient();
  const { data: payment } = await admin.from("content_payments").select("id").eq("brief_id", briefId).maybeSingle();
  if (brief.status !== "published" || !brief.selected_creator_id || payment) {
    return NextResponse.json({ error: "Ce choix ne peut plus être annulé" }, { status: 400 });
  }

  await admin
    .from("content_applications")
    .update({ status: "pending" })
    .eq("brief_id", briefId)
    .eq("creator_id", brief.selected_creator_id);
  await admin.from("content_briefs").update({ selected_creator_id: null, updated_at: new Date().toISOString() }).eq("id", briefId);

  await notify(
    brief.selected_creator_id,
    "Mission annulée",
    `Le vendeur a annulé sa sélection pour « ${brief.title} » avant le paiement.`,
    `/creator/opportunities/${briefId}`
  );

  return NextResponse.json({ success: true });
}
