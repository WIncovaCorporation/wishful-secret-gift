import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Códigos de afiliado de Wincova para cada tienda
const WINCOVA_AFFILIATE_CODES = {
  amazon: 'wincova-20', // Tu código de Amazon Associates
  walmart: 'wincova', // Tu código de Walmart Affiliates
  target: 'wincova', // Tu código de Target Affiliates
  ebay: 'wincova', // Tu código de eBay Partner Network
  etsy: 'wincova', // Tu código de Etsy Affiliates
};

interface ExternalLinkRequest {
  product_url: string;
  store: string;
  product_name: string;
  price: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_url, store, product_name, price }: ExternalLinkRequest = await req.json();

    console.log('Generating external affiliate link for:', { product_url, store, product_name });

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    let user_id = null;

    // Intentar obtener usuario autenticado
    if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: { Authorization: authHeader },
        },
      });
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      user_id = user?.id || null;
    }

    // Generar link con código de afiliado de Wincova
    let affiliate_url = product_url;
    const storeLower = store.toLowerCase();

    if (storeLower.includes('amazon')) {
      // Agregar o reemplazar tag de Amazon
      const url = new URL(product_url);
      url.searchParams.set('tag', WINCOVA_AFFILIATE_CODES.amazon);
      affiliate_url = url.toString();
    } else if (storeLower.includes('walmart')) {
      // Agregar parámetro de afiliado de Walmart
      const url = new URL(product_url);
      url.searchParams.set('affiliateId', WINCOVA_AFFILIATE_CODES.walmart);
      affiliate_url = url.toString();
    } else if (storeLower.includes('target')) {
      // Target usa diferentes parámetros según el programa
      const url = new URL(product_url);
      url.searchParams.set('afid', WINCOVA_AFFILIATE_CODES.target);
      affiliate_url = url.toString();
    } else if (storeLower.includes('ebay')) {
      // eBay usa campid para tracking
      const url = new URL(product_url);
      url.searchParams.set('campid', WINCOVA_AFFILIATE_CODES.ebay);
      affiliate_url = url.toString();
    } else if (storeLower.includes('etsy')) {
      // Etsy usa click_key y ref
      const url = new URL(product_url);
      url.searchParams.set('ref', WINCOVA_AFFILIATE_CODES.etsy);
      affiliate_url = url.toString();
    }

    // Registrar click en base de datos
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        user_id,
        product_id: null, // Producto externo, no está en nuestra DB
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent'),
        referrer: req.headers.get('referer'),
      });

    if (clickError) {
      console.error('Error registering click:', clickError);
    }

    console.log('Generated affiliate link:', affiliate_url);

    return new Response(
      JSON.stringify({ 
        affiliate_url,
        store,
        product_name,
        tracked: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating external affiliate link:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});