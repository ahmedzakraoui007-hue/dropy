import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify, notifyAdmins } from "@/lib/content-escrow";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("content_disputes")
    .select(`
      *,
      brief:content_briefs(title, status),
      payment:content_payments(amount, status),
      opened_by_profile:profiles!content_disputes_opened_by_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (profile?.role !== "admin") {
    query = query.eq("opened_by", user.id);
  }

  const { data: disputes, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(disputes);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { brief_id, reason, evidence_urls } = body;

    if (!brief_id || !reason) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: brief } = await admin
      .from("content_briefs")
      .select("id, title, store_id, selected_creator_id, is_disputed")
      .eq("id", brief_id)
      .maybeSingle();

    if (!brief) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    if (brief.is_disputed) {
      return NextResponse.json({ error: "Un litige est déjà ouvert pour cette mission" }, { status: 400 });
    }

    const { data: store } = await admin.from("stores").select("vendor_id").eq("id", brief.store_id).maybeSingle();
    const isSeller = store?.vendor_id === user.id;
    const isCreator = brief.selected_creator_id === user.id;

    if (!isSeller && !isCreator) {
      return NextResponse.json({ error: "Vous ne participez pas à cette mission" }, { status: 403 });
    }

    const { data: payment } = await admin
      .from("content_payments")
      .select("id, escrowed_at")
      .eq("brief_id", brief_id)
      .eq("status", "escrow")
      .maybeSingle();

    if (!payment?.escrowed_at) {
      return NextResponse.json({ error: "Aucun paiement sous séquestre pour cette mission" }, { status: 400 });
    }

    const { data: dispute, error: disputeError } = await admin
      .from("content_disputes")
      .insert({
        brief_id,
        payment_id: payment.id,
        opened_by: user.id,
        reason: String(reason).slice(0, 4000),
        evidence_urls: Array.isArray(evidence_urls) ? evidence_urls.slice(0, 10) : [],
        status: "open",
      })
      .select()
      .single();

    if (disputeError) throw disputeError;

    await admin.from("content_briefs").update({ is_disputed: true }).eq("id", brief_id);
    await admin.from("content_payments").update({ is_disputed: true }).eq("id", payment.id);

    const otherPartyId = isSeller ? brief.selected_creator_id : store?.vendor_id;
    await notify(
      otherPartyId,
      "⚠️ Litige ouvert",
      `Un litige a été ouvert pour la mission « ${brief.title} ». L'équipe Dropy va l'examiner.`,
      isSeller ? `/creator/missions/${brief_id}` : `/seller/content/briefs/${brief_id}`,
      "dispute_opened"
    );
    await notifyAdmins("⚖️ Nouveau litige UGC", `Litige ouvert sur « ${brief.title} ».`, "/admin/escrow");

    return NextResponse.json(dispute);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
