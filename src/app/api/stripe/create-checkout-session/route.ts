import { NextResponse } from 'next/server';
import { stripe, PLANS, PlanType, ensurePriceIds } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body as { plan: PlanType };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (plan === 'starter') {
      return NextResponse.json({ error: 'Starter plan is free' }, { status: 400 });
    }

    await ensurePriceIds();
    const planConfig = PLANS[plan];
    if (!planConfig.priceId) {
      return NextResponse.json({ error: 'Plan not available - please setup products first' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const headersList = await headers();
    const origin = headersList.get('origin') || '';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/seller/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/seller/subscription?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: plan,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan: plan,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
