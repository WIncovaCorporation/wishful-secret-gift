import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log("Extracting metadata from URL:", url);

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL es requerida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "URL inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "No se pudo acceder a la URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    
    // Extract metadata using regex
    const metadata: any = {
      url: url,
      title: '',
      description: '',
      image: '',
      price: '',
      currency: '',
      availability: true,
      siteName: parsedUrl.hostname.replace('www.', '')
    };

    // Extract Open Graph / Meta tags
    const extractMetaContent = (property: string): string => {
      const ogRegex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const nameRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const ogMatch = html.match(ogRegex);
      const nameMatch = html.match(nameRegex);
      return ogMatch?.[1] || nameMatch?.[1] || '';
    };

    // Extract title
    metadata.title = extractMetaContent('og:title') || 
                     extractMetaContent('twitter:title') ||
                     html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 
                     '';

    // Extract description
    metadata.description = extractMetaContent('og:description') || 
                          extractMetaContent('twitter:description') ||
                          extractMetaContent('description') || 
                          '';

    // Extract image
    let imageUrl = extractMetaContent('og:image') || 
                   extractMetaContent('twitter:image') ||
                   extractMetaContent('image') || 
                   '';
    
    // Make image URL absolute if relative
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, parsedUrl.origin).toString();
    }
    metadata.image = imageUrl;

    // Extract price information
    const priceRegex = /["']?price["']?\s*:\s*["']?(\d+\.?\d*)["']?/i;
    const priceMatch = html.match(priceRegex) || 
                      html.match(/\$\s*(\d+\.?\d*)/i) ||
                      html.match(/(\d+\.?\d*)\s*USD/i);
    
    if (priceMatch) {
      metadata.price = priceMatch[1];
      metadata.currency = 'USD';
    }

    // Extract product:price:amount (common in e-commerce)
    const productPrice = extractMetaContent('product:price:amount');
    const productCurrency = extractMetaContent('product:price:currency');
    if (productPrice) {
      metadata.price = productPrice;
      metadata.currency = productCurrency || 'USD';
    }

    // Check availability
    const unavailableKeywords = ['out of stock', 'agotado', 'no disponible', 'sold out'];
    const lowerHtml = html.toLowerCase();
    metadata.availability = !unavailableKeywords.some(keyword => lowerHtml.includes(keyword));

    console.log("Extracted metadata:", metadata);

    return new Response(JSON.stringify({ metadata }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error extracting metadata:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error al extraer información de la URL" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
