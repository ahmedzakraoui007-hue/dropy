import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: briefId } = await params;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from("content_payments")
      .select(`
        id,
        brief_id,
        store_id,
        creator_id,
        amount,
        platform_commission,
        creator_amount,
        status,
        stripe_payment_intent_id,
        stripe_transfer_id
      `)
      .eq("brief_id", briefId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (payment.status !== "escrowed") {
      return NextResponse.json(
        { error: `Cannot release funds. Current status: ${payment.status}` },
        { status: 400 }
      );
    }

    if (payment.stripe_transfer_id) {
      return NextResponse.json(
        { error: "Funds have already been released" },
        { status: 400 }
      );
    }

    const { data: creator, error: creatorError } = await supabase
      .from("creator_profiles")
      .select("stripe_connect_id, user_id")
      .eq("user_id", payment.creator_id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    if (!creator.stripe_connect_id) {
      return NextResponse.json(
        { error: "Creator has not connected their Stripe account" },
        { status: 400 }
      );
    }

    const creatorAmountCents = Math.round(payment.creator_amount * 100);

    const transfer = await stripe.transfers.create({
      amount: creatorAmountCents,
      currency: "eur",
      destination: creator.stripe_connect_id,
      metadata: {
        type: "content_payout",
        brief_id: briefId,
        payment_id: payment.id,
        creator_id: payment.creator_id,
        original_amount: Math.round(payment.amount * 100).toString(),
        platform_commission: Math.round(payment.platform_commission * 100).toString(),
      },
      description: `Content mission payout for brief ${briefId}`,
    });

    const { error: updateError } = await supabase
      .from("content_payments")
      .update({
        status: "released",
        stripe_transfer_id: transfer.id,
        released_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Error updating payment record:", updateError);
    }

    const { error: briefUpdateError } = await supabase
      .from("content_briefs")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", briefId);

    if (briefUpdateError) {
      console.error("Error updating brief status:", briefUpdateError);
    }

    try {
      await supabase.rpc("increment_creator_stats", {
        p_user_id: payment.creator_id,
        p_earned: payment.creator_amount,
      });
    } catch {
      // RPC function may not exist, silently continue
    }

    const { sendNotification } = await import("@/lib/notifications");
    await sendNotification({
      userId: payment.creator_id,
      title: "💰 Paiement libéré !",
      message: `Votre paiement de €${payment.creator_amount.toFixed(2)} a été libéré. Il arrivera sur votre compte Stripe sous peu.`,
      type: "payment_received",
      link: `/creator/payments`,
      sendEmail: true,
    });

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: creatorAmountCents,
      destination: creator.stripe_connect_id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Release funds error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
