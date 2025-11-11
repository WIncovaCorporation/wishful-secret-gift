import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AffiliateRequest {
  product_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id }: AffiliateRequest = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    const user_id = user?.id || null;

    console.log('Generating affiliate link for product:', product_id, 'user:', user_id);

    // Obtener producto
    const { data: product, error: productError } = await supabase
      .from('affiliate_products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Registrar click
    const { error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        user_id,
        product_id,
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent'),
        referrer: req.headers.get('referer'),
      });

    if (clickError) {
      console.error('Error registering click:', clickError);
    }

    // Generar link personalizado con tracking
    const trackingId = user_id ? `giftapp-${user_id.slice(0, 8)}` : 'giftapp-anon';
    let affiliate_url = product.affiliate_link;

    // Agregar tracking ID si es Amazon
    if (product.affiliate_network === 'amazon') {
      affiliate_url = affiliate_url.replace('tag=giftapp-20', `tag=${trackingId}`);
    }

    console.log('Generated affiliate link:', affiliate_url);

    return new Response(
      JSON.stringify({ 
        affiliate_url,
        product_name: product.name,
        commission_rate: product.commission_rate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating affiliate link:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
