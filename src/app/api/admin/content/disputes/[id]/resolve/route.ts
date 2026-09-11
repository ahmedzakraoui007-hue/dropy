import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: disputeId } = await params;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      resolution_type, 
      resolution_notes, 
      refund_amount, 
      released_amount 
    } = body;

    if (!resolution_type || !resolution_notes) {
      return NextResponse.json({ error: "Resolution type and notes are required" }, { status: 400 });
    }

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from("content_disputes")
      .select(`
        *,
        payment:content_payments(*)
      `)
      .eq("id", disputeId)
      .single();

    if (disputeError || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== "open") {
      return NextResponse.json({ error: "Dispute is already resolved" }, { status: 400 });
    }

    const payment = dispute.payment;
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const totalAmount = Number(payment.amount);
    let finalRefundAmount = 0;
    let finalReleasedAmount = 0;

    // Calculate amounts based on resolution type
    if (resolution_type === "refund_full") {
      finalRefundAmount = totalAmount;
    } else if (resolution_type === "release_full") {
      finalReleasedAmount = totalAmount;
    } else if (resolution_type === "refund_partial" || resolution_type === "release_partial") {
      finalRefundAmount = Number(refund_amount || 0);
      finalReleasedAmount = Number(released_amount || 0);

      if (Math.abs(finalRefundAmount + finalReleasedAmount - totalAmount) > 0.01) {
        return NextResponse.json({ error: "Total of refund and release must equal original payment amount" }, { status: 400 });
      }
    }

    // Execute Stripe actions
    let refundId = null;
    let transferId = null;

    // 1. Handle Refund to Seller
    if (finalRefundAmount > 0) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: Math.round(finalRefundAmount * 100), // convert to cents
      });
      refundId = refund.id;
    }

    // 2. Handle Release to Creator
    if (finalReleasedAmount > 0) {
      // Calculate creator's share (apply same ratio as original if partial?)
      // Actually, for a dispute, the admin specifies exactly what goes to creator.
      // But we should subtract platform fee from what is "released" or assume released_amount is what creator gets.
      // Usually, admin decides what part of the "total" goes to creator.
      // If original was 100, creator share 80, platform 20.
      // If admin decides 50 goes to creator, does platform still take a fee?
      // Let's assume released_amount is the GROSS amount from which we subtract commission, or just release it all.
      // Better to release exactly what admin says.
      
      const { data: creator } = await supabase
        .from("creator_profiles")
        .select("stripe_connect_id")
        .eq("user_id", payment.creator_id)
        .single();

      if (finalReleasedAmount > 0 && (!creator || !creator.stripe_connect_id)) {
        return NextResponse.json({ error: "Creator has no connected Stripe account to receive funds" }, { status: 400 });
      }

      if (creator?.stripe_connect_id) {
        const transfer = await stripe.transfers.create({
          amount: Math.round(finalReleasedAmount * 100),
          currency: "eur",
          destination: creator.stripe_connect_id,
          description: `Dispute resolution payout for brief ${dispute.brief_id}`,
        });
        transferId = transfer.id;
      }
    }

    // Update Database
    const now = new Date().toISOString();
    
    // Update Dispute
    await supabase.from("content_disputes").update({
      status: "resolved",
      resolution_type,
      resolution_notes,
      refund_amount: finalRefundAmount,
      released_amount: finalReleasedAmount,
      resolved_by: user.id,
      resolved_at: now
    }).eq("id", disputeId);

    // Update Payment
    await supabase.from("content_payments").update({
      status: finalRefundAmount === totalAmount ? "refunded" : (finalReleasedAmount === totalAmount ? "released" : "partial_resolved"),
      is_disputed: false,
      released_at: finalReleasedAmount > 0 ? now : null,
      stripe_transfer_id: transferId
    }).eq("id", payment.id);

    // Update Brief
    await supabase.from("content_briefs").update({
      status: finalRefundAmount === totalAmount ? "cancelled" : "completed",
      is_disputed: false,
      updated_at: now
    }).eq("id", dispute.brief_id);

    // Notifications
    const { data: store } = await supabase.from("stores").select("user_id").eq("id", payment.store_id).single();
    const { sendNotification } = await import("@/lib/notifications");
    
    // Notify Seller
    if (store?.user_id) {
      await sendNotification({
        userId: store.user_id,
        title: "⚖️ Litige Résolu",
        message: `Le litige pour la mission ${dispute.brief_id} a été résolu. Résolution : ${resolution_type}. Montant remboursé : €${finalRefundAmount.toFixed(2)}`,
        type: "dispute_resolved",
        link: `/seller/content/briefs/${dispute.brief_id}`,
        sendEmail: true
      });
    }

    // Notify Creator
    await sendNotification({
      userId: payment.creator_id,
      title: "⚖️ Litige Résolu",
      message: `Le litige pour la mission ${dispute.brief_id} a été résolu. Résolution : ${resolution_type}. Montant libéré : €${finalReleasedAmount.toFixed(2)}`,
      type: "dispute_resolved",
      link: `/creator/missions/${dispute.brief_id}`,
      sendEmail: true
    });

    return NextResponse.json({ success: true, refundId, transferId });
  } catch (error: any) {
    console.error("Dispute resolution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
