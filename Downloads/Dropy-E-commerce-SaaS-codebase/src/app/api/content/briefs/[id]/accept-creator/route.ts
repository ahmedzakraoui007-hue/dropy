import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: briefId } = await params;
  const { creatorId, applicationId, amount } = await request.json();

  if (!creatorId || !applicationId || !amount) {
    return NextResponse.json(
      { error: "Missing required fields: creatorId, applicationId, amount" },
      { status: 400 }
    );
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: brief, error: briefFetchError } = await supabase
      .from("content_briefs")
      .select("id, store_id, title, status")
      .eq("id", briefId)
      .single();

    if (briefFetchError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    if (brief.status !== "published") {
      return NextResponse.json(
        { error: "Brief is not in published status" },
        { status: 400 }
      );
    }

    const { data: creator, error: creatorError } = await supabase
      .from("creator_profiles")
      .select("id, stripe_connect_id, user_id")
      .eq("user_id", creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const amountInCents = Math.round(amount * 100);
    const platformCommission = Math.round(amountInCents * 0.15);
    const creatorAmount = amountInCents - platformCommission;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      metadata: {
        type: "content_escrow",
        brief_id: briefId,
        store_id: brief.store_id,
        creator_id: creatorId,
        creator_profile_id: creator.id,
        application_id: applicationId,
        platform_commission: platformCommission.toString(),
        creator_amount: creatorAmount.toString(),
        stripe_connect_id: creator.stripe_connect_id || "",
      },
    });

    const { error: paymentError } = await supabase
      .from("content_payments")
      .insert({
        brief_id: briefId,
        store_id: brief.store_id,
        creator_id: creatorId,
        amount: amount,
        platform_commission: amount * 0.15,
        creator_amount: amount * 0.85,
        status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
      });

    if (paymentError) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw paymentError;
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      platformCommission,
      creatorAmount,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Accept creator error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
