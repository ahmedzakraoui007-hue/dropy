import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/content-escrow";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["creator"]);
  if (!auth.ok) return auth.response;
  const { id: briefId } = await params;
  const body = await request.json().catch(() => ({}));

  const price = Number(body.proposed_price);
  const days = parseInt(body.delivery_days, 10);
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";
  if (!(price > 0) || !(days > 0) || message.length < 10) {
    return NextResponse.json({ error: "Prix, délai et message (10 caractères min.) sont obligatoires" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: creator } = await admin.from("creator_profiles").select("status, is_verified").eq("user_id", auth.user.id).maybeSingle();
  if (!creator || (creator.status !== "approved" && !creator.is_verified)) {
    return NextResponse.json({ error: "Votre profil créateur doit être validé pour postuler" }, { status: 403 });
  }

  const { data: brief } = await admin
    .from("content_briefs")
    .select("id, title, status, store_id, selected_creator_id")
    .eq("id", briefId)
    .maybeSingle();
  if (!brief || brief.status !== "published" || brief.selected_creator_id) {
    return NextResponse.json({ error: "Ce brief n'accepte plus de candidatures" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("content_applications")
    .select("id")
    .eq("brief_id", briefId)
    .eq("creator_id", auth.user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "Vous avez déjà postulé à ce brief" }, { status: 400 });

  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/store-assets/${auth.user.id}/`;
  const samples = Array.isArray(body.portfolio_samples)
    ? body.portfolio_samples.filter((u: unknown) => typeof u === "string" && u.startsWith(prefix)).slice(0, 5)
    : [];

  const { error } = await admin.from("content_applications").insert({
    brief_id: briefId,
    creator_id: auth.user.id,
    proposed_price: price,
    delivery_days: days,
    message,
    portfolio_samples: samples,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: "Erreur lors de l'envoi de la proposition" }, { status: 500 });

  const { data: store } = await admin.from("stores").select("vendor_id").eq("id", brief.store_id).maybeSingle();
  await notify(
    store?.vendor_id,
    "🙋 Nouvelle candidature",
    `Un créateur propose ${price.toFixed(2)} TND (livraison en ${days} jour(s)) pour « ${brief.title} ».`,
    `/seller/content/briefs/${briefId}`
  );

  return NextResponse.json({ success: true });
}
