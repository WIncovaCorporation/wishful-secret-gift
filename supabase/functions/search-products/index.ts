import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lovable.dev',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, color, size, brand, budget } = await req.json();
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, recarga tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error en la IA. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No se recibieron productos de la IA");
    }

    const products = JSON.parse(toolCall.function.arguments).products;

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in search-products:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
