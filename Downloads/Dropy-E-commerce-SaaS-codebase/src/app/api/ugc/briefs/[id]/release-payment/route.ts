// src/app/api/ugc/briefs/[id]/release-payment/route.ts
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

    // 1. Get payment info
    const { data: payment, error: paymentError } = await supabase
      .from("ugc_payments")
      .select("*")
      .eq("brief_id", briefId)
      .eq("status", "held")
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Held payment not found for this brief" }, { status: 404 });
    }

    // 2. Get creator stripe account
    const { data: creator, error: creatorError } = await supabase
      .from("creator_profiles")
      .select("stripe_connect_id, user_id")
      .eq("id", payment.creator_id)
      .single();

    if (creatorError || !creator || !creator.stripe_connect_id) {
      return NextResponse.json({ error: "Creator Stripe account not found" }, { status: 400 });
    }

    // 3. Payout to creator
    const creatorAmountCents = Math.round(payment.creator_amount * 100);
    
    const transfer = await stripe.transfers.create({
      amount: creatorAmountCents,
      currency: "eur", // Dropy uses EUR for Stripe transfers
      destination: creator.stripe_connect_id,
      metadata: {
        type: "ugc_payout",
        brief_id: briefId,
        payment_id: payment.id,
      },
      description: `UGC Brief Payout: ${briefId}`,
    });

    // 4. Update payment status
    await supabase
      .from("ugc_payments")
      .update({
        status: "released",
        stripe_transfer_id: transfer.id,
        released_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // 5. Update brief status
    await supabase
      .from("ugc_briefs")
      .update({ status: "completed" })
      .eq("id", briefId);

    // 6. Notify Creator
    const { sendNotification } = await import("@/lib/notifications");
    await sendNotification({
      userId: creator.user_id,
      title: "💰 Paiement libéré !",
      message: `Le vendeur a validé le contenu et libéré votre paiement de ${payment.creator_amount} TND.`,
      type: "payment_received",
      link: `/creator/payments`,
      sendEmail: true,
    });

    return NextResponse.json({ success: true, transferId: transfer.id });
  } catch (error: any) {
    console.error("Release payment error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
