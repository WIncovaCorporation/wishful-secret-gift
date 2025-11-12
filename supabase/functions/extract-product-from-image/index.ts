import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("No se proporcionó imagen");
    }

    console.log("Extracting product info from image...");

    const systemPrompt = `Eres un asistente experto en identificar productos de capturas de pantalla. Analiza la imagen y extrae:
- Nombre del producto (title)
- Precio aproximado en USD (price) - solo el número
- Descripción breve del producto (description)
- URL del producto si es visible (url)
- Categoría apropiada (category): "electronics", "fashion", "home", "books", "sports", u "other"

Si no puedes identificar algún dato, responde con null para ese campo.`;

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
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "Extrae la información del producto de esta imagen."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_product_info",
              description: "Extrae información estructurada del producto de la imagen",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Nombre completo del producto" },
                  price: { type: "number", description: "Precio en USD (solo número, sin símbolo)" },
                  description: { type: "string", description: "Descripción del producto" },
                  url: { type: "string", description: "URL del producto si es visible" },
                  category: { 
                    type: "string", 
                    enum: ["electronics", "fashion", "home", "books", "sports", "other"],
                    description: "Categoría del producto" 
                  },
                  image_url: { type: "string", description: "URL de la imagen del producto si es visible" }
                },
                required: ["title", "category"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_product_info" } }
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
      throw new Error("No se pudo extraer información del producto");
    }

    const productInfo = JSON.parse(toolCall.function.arguments);
    console.log("Extracted product info:", productInfo);

    return new Response(JSON.stringify({ product: productInfo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in extract-product-from-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});