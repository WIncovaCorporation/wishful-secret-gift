import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      item_id, 
      item_name, 
      category, 
      reference_link,
      user_id 
    } = await req.json();

    console.log('🎁 Tracking affiliate click:', { item_name, category });

    // Get client IP (Deno Deploy provides this)
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Get referrer
    const referrer = req.headers.get('referer') || 'direct';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a simplified tracking record
    // Note: affiliate_clicks table expects product_id from affiliate_products
    // For gift_items, we'll log to a different approach or create custom table
    
    console.log('📊 Click tracking data:', {
      item_id,
      item_name,
      category,
      user_id,
      ip: clientIP,
      user_agent: userAgent,
      referrer,
      timestamp: new Date().toISOString()
    });

    // TODO: Store in custom gift_link_clicks table if needed
    // For now, just return success with tracking info

    return new Response(
      JSON.stringify({ 
        success: true,
        tracked: {
          item: item_name,
          category,
          timestamp: new Date().toISOString(),
          source: referrer
        },
        message: '¡Click rastreado exitosamente! Gracias por usar nuestro link 🎁'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error tracking click:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
