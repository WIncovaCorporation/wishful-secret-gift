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
    
    // Extract metadata using multiple strategies for maximum accuracy
    const metadata: any = {
      url: url,
      title: '',
      description: '',
      image: '',
      price: '',
      originalPrice: '',
      discountPercentage: '',
      currency: 'USD',
      availability: true,
      siteName: parsedUrl.hostname.replace('www.', ''),
      rating: '',
      reviewCount: '',
      isPrime: false,
      inStock: true
    };

    // Helper function to extract meta content
    const extractMetaContent = (property: string): string => {
      const ogRegex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const nameRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const ogMatch = html.match(ogRegex);
      const nameMatch = html.match(nameRegex);
      return ogMatch?.[1] || nameMatch?.[1] || '';
    };

    // Helper to decode HTML entities
    const decodeHTML = (text: string): string => {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
    };

    // Extract title with fallbacks
    metadata.title = decodeHTML(
      extractMetaContent('og:title') || 
      extractMetaContent('twitter:title') ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 
      html.match(/<h1[^>]*id=["']productTitle["'][^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ||
      ''
    );

    // Extract description
    metadata.description = decodeHTML(
      extractMetaContent('og:description') || 
      extractMetaContent('twitter:description') ||
      extractMetaContent('description') || 
      ''
    );

    // Extract main product image (prioritize large images)
    let imageUrl = extractMetaContent('og:image') || 
                   extractMetaContent('og:image:secure_url') ||
                   extractMetaContent('twitter:image') ||
                   extractMetaContent('twitter:image:src') ||
                   html.match(/["']primary_image["']\s*:\s*["']([^"']+)["']/i)?.[1] ||
                   html.match(/["']hiRes["']\s*:\s*["']([^"']+)["']/i)?.[1] ||
                   html.match(/["']large["']\s*:\s*["']([^"']+)["']/i)?.[1] ||
                   html.match(/<img[^>]*id=["']landingImage["'][^>]*src=["']([^"']+)["']/i)?.[1] ||
                   html.match(/<img[^>]*class=["'][^"']*product[^"']*["'][^>]*src=["']([^"']+)["']/i)?.[1] ||
                   html.match(/<img[^>]*data-src=["']([^"']+)["'][^>]*class=["'][^"']*product/i)?.[1] ||
                   '';
    
    console.log("Raw image URL extracted:", imageUrl);
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, parsedUrl.origin).toString();
      console.log("Converted relative URL to absolute:", imageUrl);
    }
    
    // Clean query parameters that might prevent loading
    if (imageUrl) {
      try {
        const imgUrl = new URL(imageUrl);
        // Keep essential params only
        const essentialParams = ['width', 'height', 'w', 'h', 'fit', 'fmt', 'q'];
        const newParams = new URLSearchParams();
        essentialParams.forEach(param => {
          if (imgUrl.searchParams.has(param)) {
            newParams.set(param, imgUrl.searchParams.get(param)!);
          }
        });
        imgUrl.search = newParams.toString();
        imageUrl = imgUrl.toString();
        console.log("Cleaned image URL:", imageUrl);
      } catch (e) {
        console.log("Failed to clean image URL, using original:", e);
      }
    }
    
    metadata.image = imageUrl;

    // Advanced price extraction for Amazon and e-commerce sites
    // Try multiple price patterns in order of reliability
    
    // Pattern 1: Amazon's priceblock with separate whole and fraction parts
    let priceMatch = html.match(/class=["']a-price-whole["'][^>]*>(\d+)[\.,]?/i);
    if (priceMatch) {
      const dollars = priceMatch[1];
      // Try to find the cents/fraction part
      const centsMatch = html.match(/class=["']a-price-fraction["'][^>]*>(\d+)/i);
      const cents = centsMatch ? centsMatch[1].padStart(2, '0').slice(0, 2) : '00';
      metadata.price = `${dollars}.${cents}`;
    }

    // Pattern 2: Amazon deal price
    if (!metadata.price) {
      priceMatch = html.match(/class=["']a-price["'][^>]*>.*?<span[^>]*>.*?\$(\d+\.?\d*)/is);
      if (priceMatch) metadata.price = priceMatch[1];
    }

    // Pattern 3: JSON-LD structured data
    if (!metadata.price) {
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.offers?.price) {
            metadata.price = jsonData.offers.price.toString();
            metadata.currency = jsonData.offers.priceCurrency || 'USD';
          } else if (jsonData.price) {
            metadata.price = jsonData.price.toString();
          }
        } catch (e) {
          console.log('Failed to parse JSON-LD:', e);
        }
      }
    }

    // Pattern 4: Meta tags
    if (!metadata.price) {
      const productPrice = extractMetaContent('product:price:amount');
      const productCurrency = extractMetaContent('product:price:currency');
      if (productPrice) {
        metadata.price = productPrice;
        metadata.currency = productCurrency || 'USD';
      }
    }

    // Pattern 5: Generic patterns
    if (!metadata.price) {
      const genericMatch = html.match(/(?:price|precio)["\s:]+.*?\$?\s*(\d+[.,]\d{2})/i) ||
                          html.match(/\$\s*(\d+\.\d{2})/i) ||
                          html.match(/USD\s*(\d+\.\d{2})/i);
      if (genericMatch) {
        metadata.price = genericMatch[1].replace(',', '.');
      }
    }

    // Extract original price (for discounts)
    const originalPriceMatch = html.match(/class=["']a-price a-text-price["'][^>]*>.*?\$(\d+\.?\d*)/is) ||
                               html.match(/class=["']a-text-strike["'][^>]*>.*?\$(\d+\.?\d*)/is) ||
                               html.match(/list-price["\s:]+.*?\$(\d+\.?\d*)/i) ||
                               html.match(/was[:\s]+\$(\d+\.?\d*)/i);
    
    if (originalPriceMatch && originalPriceMatch[1] !== metadata.price) {
      metadata.originalPrice = originalPriceMatch[1];
      
      // Calculate discount percentage
      if (metadata.price && metadata.originalPrice) {
        const current = parseFloat(metadata.price);
        const original = parseFloat(metadata.originalPrice);
        if (original > current) {
          const discount = ((original - current) / original * 100).toFixed(0);
          metadata.discountPercentage = discount;
        }
      }
    }

    // Extract rating
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:out of|de)\s*5\s*stars/i) ||
                       html.match(/rating["\s:]+(\d+\.?\d*)/i) ||
                       html.match(/["']ratingValue["']\s*:\s*["']?(\d+\.?\d*)["']?/i);
    if (ratingMatch) {
      metadata.rating = ratingMatch[1];
    }

    // Extract review count
    const reviewMatch = html.match(/(\d+(?:,\d{3})*)\s*(?:ratings|calificaciones|reviews|reseñas)/i) ||
                       html.match(/["']reviewCount["']\s*:\s*["']?(\d+(?:,\d{3})*)["']?/i);
    if (reviewMatch) {
      metadata.reviewCount = reviewMatch[1].replace(/,/g, '');
    }

    // Detect Amazon Prime eligibility
    const primeKeywords = ['amazon prime', 'prime eligible', 'elegible para prime', 'entrega rápida y gratis'];
    metadata.isPrime = primeKeywords.some(keyword => html.toLowerCase().includes(keyword));

    // Enhanced availability check
    const unavailableKeywords = [
      'currently unavailable',
      'out of stock', 
      'agotado', 
      'no disponible',
      'sold out',
      'sin stock',
      'temporarily out of stock'
    ];
    const availableKeywords = [
      'in stock',
      'disponible',
      'available now',
      'add to cart',
      'agregar al carrito'
    ];
    
    const lowerHtml = html.toLowerCase();
    const hasUnavailable = unavailableKeywords.some(keyword => lowerHtml.includes(keyword));
    const hasAvailable = availableKeywords.some(keyword => lowerHtml.includes(keyword));
    
    metadata.availability = !hasUnavailable || hasAvailable;
    metadata.inStock = metadata.availability;

    console.log("Extracted metadata:", metadata);

    // Validate if we got useful information
    const hasUsefulData = metadata.title && metadata.title !== parsedUrl.hostname.replace('www.', '') && metadata.title !== 'Amazon.com';
    
    if (!hasUsefulData) {
      return new Response(
        JSON.stringify({ 
          error: "No se pudo extraer información del producto. Algunos sitios (como Amazon) bloquean la extracción automática. Puedes agregar el producto manualmente con los detalles que conozcas." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
