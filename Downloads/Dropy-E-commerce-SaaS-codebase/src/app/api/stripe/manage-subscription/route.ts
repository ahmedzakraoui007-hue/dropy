import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body as { action: 'cancel' | 'reactivate' };

    if (action === 'cancel') {
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return NextResponse.json({ message: 'Subscription will be canceled at period end' });
    } else if (action === 'reactivate') {
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      return NextResponse.json({ message: 'Subscription reactivated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status, stripe_subscription_id, subscription_period_end')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let cancelAtPeriodEnd = false;
    if (profile.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      cancelAtPeriodEnd = subscription.cancel_at_period_end;
    }

    return NextResponse.json({
      plan: profile.subscription_plan || 'starter',
      status: profile.subscription_status || 'active',
      periodEnd: profile.subscription_period_end,
      cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
