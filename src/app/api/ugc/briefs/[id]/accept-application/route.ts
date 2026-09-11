// src/app/api/ugc/briefs/[id]/accept-application/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: briefId } = await params;
  const { applicationId, amount } = await request.json();

  if (!applicationId || !amount) {
    return NextResponse.json(
      { error: "Missing required fields: applicationId, amount" },
      { status: 400 }
    );
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Verify brief and ownership
    const { data: brief, error: briefFetchError } = await supabase
      .from("ugc_briefs")
      .select("id, seller_id, title, status")
      .eq("id", briefId)
      .eq("seller_id", user.id)
      .single();

    if (briefFetchError || !brief) {
      return NextResponse.json({ error: "Brief not found or access denied" }, { status: 404 });
    }

    // 2. Get application and creator info
    const { data: application, error: appError } = await supabase
      .from("ugc_applications")
      .select("*, creator:creator_profiles(*)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // 3. Setup payment amounts
    const amountInCents = Math.round(amount * 100);
    const platformFee = Math.round(amountInCents * 0.15); // 15% platform fee
    const creatorAmount = amountInCents - platformFee;

    // 4. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur", // Or TND if using a provider that supports it, Dropy uses EUR/TND mix
      metadata: {
        type: "ugc_escrow",
        brief_id: briefId,
        seller_id: user.id,
        creator_id: application.creator_id,
        application_id: applicationId,
      },
    });

    // 5. Record in ugc_payments
    const { error: paymentError } = await supabase
      .from("ugc_payments")
      .insert({
        brief_id: briefId,
        application_id: applicationId,
        creator_id: application.creator_id,
        seller_id: user.id,
        amount: amount,
        platform_fee: amount * 0.15,
        creator_amount: amount * 0.85,
        status: "held",
        stripe_transfer_id: paymentIntent.id, // Using this field to store PI ID temporarily
      });

    if (paymentError) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw paymentError;
    }

    // 6. Update statuses
    await supabase.from("ugc_applications").update({ status: "accepted" }).eq("id", applicationId);
    await supabase.from("ugc_applications").update({ status: "rejected" }).eq("brief_id", briefId).neq("id", applicationId);
    await supabase.from("ugc_briefs").update({ status: "in_progress" }).eq("id", briefId);

    // 7. Notify Creator
    const { sendNotification } = await import("@/lib/notifications");
    await sendNotification({
      userId: application.creator.user_id,
      type: "brief_accepted",
      title: "🎉 Candidature acceptée !",
      message: `Votre candidature pour le brief "${brief.title}" a été acceptée. Vous pouvez commencer la création.`,
      link: `/creator/missions/${briefId}`,
      sendEmail: true,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("Escrow error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
