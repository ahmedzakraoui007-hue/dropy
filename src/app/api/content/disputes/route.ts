import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { brief_id, reason, evidence_urls } = body;

    if (!brief_id || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if brief exists and user is involved
    const { data: brief, error: briefError } = await supabase
      .from("content_briefs")
      .select("id, store_id, selected_creator_id, is_disputed")
      .eq("id", brief_id)
      .single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    if (brief.is_disputed) {
      return NextResponse.json({ error: "This mission is already in dispute" }, { status: 400 });
    }

    // Get store owner
    const { data: store } = await supabase
      .from("stores")
      .select("user_id")
      .eq("id", brief.store_id)
      .single();

    const isSeller = store?.user_id === user.id;
    const isCreator = brief.selected_creator_id === user.id;

    if (!isSeller && !isCreator) {
      return NextResponse.json({ error: "You are not authorized to open a dispute for this mission" }, { status: 403 });
    }

    // Get payment record
    const { data: payment } = await supabase
      .from("content_payments")
      .select("id")
      .eq("brief_id", brief_id)
      .eq("status", "escrowed")
      .single();

    if (!payment) {
      return NextResponse.json({ error: "No active escrow payment found for this mission" }, { status: 400 });
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from("content_disputes")
      .insert({
        brief_id,
        payment_id: payment.id,
        opened_by: user.id,
        reason,
        evidence_urls: evidence_urls || [],
        status: "open"
      })
      .select()
      .single();

    if (disputeError) {
      throw disputeError;
    }

    // Update brief and payment status
    await supabase.from("content_briefs").update({ is_disputed: true }).eq("id", brief_id);
    await supabase.from("content_payments").update({ is_disputed: true }).eq("id", payment.id);

    // Notifications
    const otherPartyId = isSeller ? brief.selected_creator_id : store?.user_id;
    const { sendNotification } = await import("@/lib/notifications");
    
    if (otherPartyId) {
      await sendNotification({
        userId: otherPartyId,
        title: "⚠️ Litige Ouvert",
        message: `Un litige a été ouvert pour la mission: ${brief_id}. Notre équipe va l'examiner sous peu.`,
        type: "dispute_opened",
        link: isSeller ? `/creator/missions/${brief_id}` : `/seller/content/briefs/${brief_id}`,
        sendEmail: true
      });
    }

    return NextResponse.json(dispute);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
