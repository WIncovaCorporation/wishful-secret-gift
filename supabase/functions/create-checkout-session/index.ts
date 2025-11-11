import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  plan_id: string;
  billing_cycle: 'monthly' | 'annual';
  success_url?: string;
  cancel_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan_id, billing_cycle, success_url, cancel_url }: CheckoutRequest = await req.json();

    // Obtener usuario autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Creating checkout session for user:', user.id);

    // Obtener plan de base de datos
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    const price_id = billing_cycle === 'monthly' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_annual;

    if (!price_id) {
      throw new Error('Price ID not configured for this plan');
    }

    // Verificar si usuario ya tiene customer_id en Stripe
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Nota: Esta función requiere Stripe API keys configuradas
    // Por ahora, retornamos URL de ejemplo
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe not configured yet',
          message: 'Stripe API keys pending configuration',
          checkout_url: '/pricing?status=pending'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Cuando Stripe esté configurado, crear la sesión real
    const stripe = await import('https://esm.sh/stripe@14.21.0?target=deno');
    const stripeClient = new stripe.default(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: stripe.default.createFetchHttpClient(),
    });

    let customer_id = existingSubscription?.stripe_customer_id;

    // Crear customer si no existe
    if (!customer_id) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customer_id = customer.id;
    }

    // Crear checkout session
    const session = await stripeClient.checkout.sessions.create({
      customer: customer_id,
      line_items: [{
        price: price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: success_url || `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/pricing`,
      metadata: {
        user_id: user.id,
        plan_id,
        billing_cycle,
      },
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
