import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, minPrice, maxPrice } = await req.json();
    
    console.log('Searching Wincova catalog:', { query, category, minPrice, maxPrice });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query for Wincova products (owner_id IS NULL)
    let dbQuery = supabase
      .from('affiliate_products')
      .select('*')
      .is('owner_id', null)
      .eq('is_active', true);

    // Add text search if query provided
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    }

    // Add category filter
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    // Add price range filters
    if (minPrice !== undefined && minPrice !== null) {
      dbQuery = dbQuery.gte('price', minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      dbQuery = dbQuery.lte('price', maxPrice);
    }

    // Limit results and order by relevance
    dbQuery = dbQuery.order('created_at', { ascending: false }).limit(10);

    const { data: products, error } = await dbQuery;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${products?.length || 0} products in Wincova catalog`);

    // Transform to standard format
    const formattedProducts = products?.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency || 'USD',
      category: p.category,
      description: p.description,
      image_url: p.image_url,
      store: 'Wincova',
      link: `https://wincova.com/product/${p.id}`,
      source: 'wincova',
      commission_rate: p.commission_rate || 0,
    })) || [];

    return new Response(
      JSON.stringify({ 
        products: formattedProducts,
        total: formattedProducts.length,
        source: 'wincova_catalog'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in search-wincova-products:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        products: [],
        total: 0
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
