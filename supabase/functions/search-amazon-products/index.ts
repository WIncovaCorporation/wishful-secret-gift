import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}

// Amazon PA-API signature helper usando Deno crypto
async function hmacSha256(key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = typeof key === 'string' ? encoder.encode(key) : key;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function createAwsSignature(
  method: string,
  host: string,
  path: string,
  queryString: string,
  headers: Record<string, string>,
  payload: string,
  accessKey: string,
  secretKey: string
) {
  const algorithm = 'AWS4-HMAC-SHA256';
  const dateStamp = headers['x-amz-date'].substring(0, 8);
  const credentialScope = `${dateStamp}/us-east-1/ProductAdvertisingAPI/aws4_request`;

  // Create canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
    .join('');
  const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');
  const payloadHash = await sha256(payload);
  
  const canonicalRequest = [
    method,
    path,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  // Create string to sign
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = [
    algorithm,
    headers['x-amz-date'],
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  // Calculate signature
  const kDate = await hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, 'us-east-1');
  const kService = await hmacSha256(kRegion, 'ProductAdvertisingAPI');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signatureBuffer = await hmacSha256(kSigning, stringToSign);
  const signature = arrayBufferToHex(signatureBuffer);

  return `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      throw new Error('Unauthorized');
    }

    // Verificar feature disponible según plan
    const { data: features } = await supabase.rpc('get_user_features', { _user_id: user.id });
    if (!features?.amazon_product_search) {
      return new Response(
        JSON.stringify({ 
          error: 'Esta función requiere un plan Premium. Actualiza tu plan para acceder a búsqueda de productos de Amazon.',
          requiresUpgrade: true
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obtener credenciales de Amazon del usuario
    const { data: credentials, error: credError } = await supabase
      .from('amazon_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ 
          error: 'Credenciales de Amazon no configuradas. Por favor configura tus credenciales de Amazon PA-API primero.',
          needsSetup: true
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { query, category, minPrice, maxPrice, page = 1 }: SearchRequest = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    // Construir request a Amazon PA-API
    const host = 'webservices.amazon.com';
    const path = '/paapi5/searchitems';
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    
    const payload = JSON.stringify({
      Keywords: query,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'BrowseNodeInfo.BrowseNodes',
      ],
      SearchIndex: category || 'All',
      ItemPage: page,
      ItemCount: 10,
      MinPrice: minPrice,
      MaxPrice: maxPrice,
      PartnerTag: credentials.associate_tag,
      PartnerType: 'Associates',
      Marketplace: `www.amazon.${credentials.marketplace.toLowerCase() === 'us' ? 'com' : credentials.marketplace.toLowerCase()}`
    });

    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'host': host,
      'x-amz-date': timestamp,
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
    };

    const authorization = await createAwsSignature(
      'POST',
      host,
      path,
      '',
      headers,
      payload,
      credentials.access_key,
      credentials.secret_key
    );

    // Llamar a Amazon PA-API
    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Authorization': authorization
      },
      body: payload
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amazon API error:', response.status, errorText);
      throw new Error(`Amazon API error: ${response.status}`);
    }

    const data = await response.json();

    // Transformar respuesta de Amazon a formato estándar
    const products = (data.SearchResult?.Items || []).map((item: any) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || '',
      price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
      currency: item.Offers?.Listings?.[0]?.Price?.Currency || 'USD',
      image_url: item.Images?.Primary?.Large?.URL || '',
      product_url: item.DetailPageURL || '',
      features: item.ItemInfo?.Features?.DisplayValues || [],
      category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || category || 'General',
    }));

    // Registrar búsqueda
    await supabase
      .from('amazon_search_tracking')
      .insert({
        user_id: user.id,
        search_query: query,
        results_count: products.length
      });

    console.log(`Search completed: ${products.length} products found for query "${query}"`);

    return new Response(
      JSON.stringify({ 
        products,
        totalResults: data.SearchResult?.TotalResultCount || 0,
        searchQuery: query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-amazon-products:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
