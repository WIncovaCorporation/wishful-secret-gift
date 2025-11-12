import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const body = await req.text();
  
  const stripe = await import('https://esm.sh/stripe@14.21.0?target=deno');
  const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: stripe.default.createFetchHttpClient(),
  });

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return new Response('Webhook error', { status: 400 });
  }

  console.log('Received Stripe event:', event.type);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { user_id, plan_id } = session.metadata;

        // Obtener subscription de Stripe
        const subscription = await stripeClient.subscriptions.retrieve(session.subscription as string);

        // Insertar en user_subscriptions
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id,
            plan_id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (subError) {
          console.error('Error inserting subscription:', subError);
          break;
        }

        // Actualizar rol del usuario
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', plan_id)
          .single();

        if (planData) {
          const role = planData.name === 'premium_business' ? 'corporate_manager' : 'premium_user';
          
          await supabase
            .from('user_roles')
            .insert({
              user_id,
              role,
            });
        }

        console.log('Subscription created successfully for user:', user_id);

        // Send confirmation email
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(user_id);
          if (userData?.user?.email) {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-email`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` 
              },
              body: JSON.stringify({
                email: userData.user.email,
                name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0],
                type: 'confirmed',
                plan: plan_id,
                nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('es-MX'),
                amount: subscription.items.data[0]?.plan?.amount ? subscription.items.data[0].plan.amount / 100 : 0
              })
            });
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;

        await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription updated:', subscription.id);

        // Send renewal email if subscription is active
        if (subscription.status === 'active') {
          try {
            const { data: subData } = await supabase
              .from('user_subscriptions')
              .select('user_id, plan_id')
              .eq('stripe_subscription_id', subscription.id)
              .single();

            if (subData?.user_id) {
              const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id);
              if (userData?.user?.email) {
                await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-email`, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` 
                  },
                  body: JSON.stringify({
                    email: userData.user.email,
                    name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0],
                    type: 'renewed',
                    plan: subData.plan_id,
                    nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('es-MX'),
                    amount: subscription.items.data[0]?.plan?.amount ? subscription.items.data[0].plan.amount / 100 : 0
                  })
                });
              }
            }
          } catch (emailError) {
            console.error('Error sending renewal email:', emailError);
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        // Actualizar status a canceled
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Obtener user_id
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData) {
          // Remover roles premium
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', subData.user_id)
            .in('role', ['premium_user', 'corporate_manager']);

          // Asegurar que tenga free_user
          await supabase
            .from('user_roles')
            .insert({
              user_id: subData.user_id,
              role: 'free_user',
            });
        }

        console.log('Subscription canceled:', subscription.id);

        // Send cancellation email
        if (subData?.user_id) {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id);
            if (userData?.user?.email) {
              await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-email`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` 
                },
                body: JSON.stringify({
                  email: userData.user.email,
                  name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0],
                  type: 'cancelled',
                  plan: subscription.items.data[0]?.plan?.id || 'premium'
                })
              });
            }
          } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
          }
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;

        await supabase
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription);

        console.log('Payment failed for subscription:', invoice.subscription);

        // Send payment failed email
        try {
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('user_id, plan_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          if (subData?.user_id) {
            const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id);
            if (userData?.user?.email) {
              await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-email`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` 
                },
                body: JSON.stringify({
                  email: userData.user.email,
                  name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0],
                  type: 'payment_failed',
                  plan: subData.plan_id,
                  amount: invoice.amount_due ? invoice.amount_due / 100 : 0
                })
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending payment failed email:', emailError);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
