import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = [
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

const REQUEST_TIMEOUT = 10000; // 10 seconds timeout

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, color, size, brand, budget } = await req.json();
    
    // Input validation
    if (!category || typeof category !== 'string') {
      return new Response(
        JSON.stringify({ error: "Categoría requerida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (category.length < 2) {
      return new Response(
        JSON.stringify({ error: "La categoría debe tener al menos 2 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (category.length > 100) {
      return new Response(
        JSON.stringify({ error: "La categoría no puede exceder 100 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build search context
    let searchContext = `Necesito encontrar productos reales de ${category}`;
    if (color) searchContext += ` de color ${color}`;
    if (size) searchContext += ` talla ${size}`;
    if (brand) searchContext += ` de la marca ${brand}`;
    if (budget) searchContext += ` con precio hasta $${budget} USD`;

    const systemPrompt = `Eres un asistente experto en búsqueda de productos online. Tu tarea es generar 5 opciones REALES de productos específicos con enlaces directos a tiendas.

IMPORTANTE:
- Genera enlaces REALES a tiendas como Amazon, eBay, AliExpress, etc.
- Los enlaces deben ser URLs completas y funcionales
- Incluye el precio aproximado en USD
- Describe el producto específicamente
- Varía entre diferentes tiendas online
${budget ? `- RESPETA EL PRESUPUESTO: Todas las opciones deben estar dentro de $${budget} USD` : ''}`;

    const userPrompt = `${searchContext}

Busca 5 productos reales disponibles en tiendas online ${budget ? `dentro del presupuesto de $${budget} USD` : ''}.`;

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
    });

    // Race between API call and timeout
    const response = await Promise.race([
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "search_products",
                description: "Devuelve productos reales encontrados en tiendas online",
                parameters: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Nombre completo del producto" },
                          description: { type: "string", description: "Descripción breve del producto" },
                          price: { type: "number", description: "Precio aproximado en USD" },
                          store: { type: "string", description: "Nombre de la tienda online" },
                          url: { type: "string", description: "URL completa del producto en la tienda" },
                          image_description: { type: "string", description: "Descripción de cómo se ve el producto" }
                        },
                        required: ["name", "description", "price", "store", "url"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["products"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "search_products" } }
        }),
      }),
      timeoutPromise
    ]) as Response;

    if (!response.ok) {
      console.error("API error response:", response.status, response.statusText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible. Intenta de nuevo más tarde." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error("AI gateway error:", response.status, errorText);
      
      return new Response(
        JSON.stringify({ error: "No pudimos completar la búsqueda. Por favor intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call in response");
      return new Response(
        JSON.stringify({ error: "No se encontraron productos. Intenta con términos de búsqueda diferentes." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const products = JSON.parse(toolCall.function.arguments).products;

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontraron productos para tu búsqueda. Intenta con otros criterios." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${products.length} products for: ${category}`);

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in search-products:", error);
    
    // Handle timeout specifically
    if (error.message === 'Request timeout') {
      return new Response(
        JSON.stringify({ error: "La búsqueda tardó demasiado. Por favor intenta de nuevo." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return new Response(
        JSON.stringify({ error: "Error de conexión. Verifica tu conexión a internet e intenta de nuevo." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generic error (don't expose internals)
    return new Response(
      JSON.stringify({ error: "Ocurrió un error inesperado. Por favor intenta de nuevo más tarde." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
