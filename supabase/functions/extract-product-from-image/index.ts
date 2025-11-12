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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY no está configurada");
    }

    if (!imageBase64) {
      throw new Error("No se proporcionó imagen");
    }

    console.log("Extracting product info from image...");

    // Extraer solo la parte base64 si viene con el prefijo data:image
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    console.log("Extracting product info using Gemini API Direct...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres un asistente experto en identificar productos de capturas de pantalla. Analiza esta imagen y extrae la información del producto en formato JSON con estos campos:
- title: Nombre completo del producto (string, requerido)
- price: Precio en USD, solo el número sin símbolo (number, opcional)
- description: Descripción breve del producto (string, opcional)
- url: URL del producto si es visible (string, opcional)
- category: Una de estas categorías: "electronics", "fashion", "home", "books", "sports", "other" (string, requerido)
- image_url: URL de la imagen del producto si es visible (string, opcional)

Responde ÚNICAMENTE con un objeto JSON válido. Si no puedes identificar algún dato opcional, omítelo o usa null.`
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes de Gemini API excedido. Intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error en Gemini API. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data));

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error("No se recibió respuesta válida de Gemini API");
    }

    // Parsear el JSON de la respuesta
    const productInfo = JSON.parse(textContent);
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