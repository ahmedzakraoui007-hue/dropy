import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_end?: number;
};

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          if (session.mode === 'subscription' && session.subscription) {
            const supabaseUserId = session.metadata?.supabase_user_id;
            const plan = session.metadata?.plan;
            
            if (supabaseUserId) {
              const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
              ) as SubscriptionWithPeriod;
              
              const { error } = await supabase
                .from('profiles')
                .update({
                  stripe_subscription_id: subscription.id,
                  subscription_status: subscription.status,
                  subscription_plan: plan || 'pro',
                  subscription_period_end: subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000).toISOString()
                    : null,
                })
                .eq('id', supabaseUserId);

            if (error) {
              console.error('Error updating profile after checkout:', error);
              throw error;
            }
            
            console.log(`Checkout completed for user ${supabaseUserId}, plan: ${plan}`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (paymentIntent.metadata?.type === 'content_escrow') {
          const { 
            brief_id, 
            creator_id, 
            application_id 
          } = paymentIntent.metadata;

          if (!brief_id || !creator_id || !application_id) {
            console.error('Missing metadata in content_escrow payment intent');
            break;
          }

          const { error: paymentError } = await supabase
            .from('content_payments')
            .update({
              status: 'escrowed',
              escrowed_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          if (paymentError) {
            console.error('Error updating content_payments:', paymentError);
            throw paymentError;
          }

          const { error: briefError } = await supabase
            .from('content_briefs')
            .update({
              status: 'assigned',
              selected_creator_id: creator_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', brief_id);

          if (briefError) {
            console.error('Error updating content_briefs:', briefError);
            throw briefError;
          }

          const { error: appError } = await supabase
            .from('content_applications')
            .update({ status: 'accepted' })
            .eq('id', application_id);

          if (appError) {
            console.error('Error updating content_applications:', appError);
          }

          await supabase
            .from('content_applications')
            .update({ status: 'rejected' })
            .eq('brief_id', brief_id)
            .neq('id', application_id);

            const { sendNotification } = await import('@/lib/notifications');
            await sendNotification({
              userId: creator_id,
              title: "🎉 Vous avez été sélectionné !",
              message: `Le vendeur a accepté votre proposition. Le paiement est en séquestre (Escrow). Vous pouvez commencer la mission !`,
              type: 'brief_accepted',
              link: `/creator/missions/${brief_id}`,
              sendEmail: true,
            });


          console.log(`Content escrow payment succeeded for brief: ${brief_id}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as SubscriptionWithPeriod;
        const supabaseUserId = subscription.metadata?.supabase_user_id;
        const plan = subscription.metadata?.plan;

        if (supabaseUserId && subscription.current_period_end) {
          await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_plan: plan || 'pro',
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', supabaseUserId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const supabaseUserId = subscription.metadata?.supabase_user_id;

        if (supabaseUserId) {
          await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: null,
              subscription_status: 'canceled',
              subscription_plan: 'starter',
              subscription_period_end: null,
            })
            .eq('id', supabaseUserId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = 'subscription' in invoice ? invoice.subscription : null;
        if (subscriptionId && typeof subscriptionId === 'string') {
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
          const supabaseUserId = subscriptionData.metadata?.supabase_user_id;

          const subscriptionWithPeriod = subscriptionData as SubscriptionWithPeriod;
          if (supabaseUserId && subscriptionWithPeriod.current_period_end) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_period_end: new Date(subscriptionWithPeriod.current_period_end * 1000).toISOString(),
              })
              .eq('id', supabaseUserId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = 'subscription' in invoice ? invoice.subscription : null;
        if (subscriptionId && typeof subscriptionId === 'string') {
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const supabaseUserId = subscriptionResponse.metadata?.supabase_user_id;

          if (supabaseUserId) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', supabaseUserId);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error processing webhook:', errorMessage);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
