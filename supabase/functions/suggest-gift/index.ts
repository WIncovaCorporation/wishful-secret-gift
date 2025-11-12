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
    const { context, existingItems, budget } = await req.json();
    console.log("Request received:", { context, existingItems, budget });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Configuración de IA no disponible" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Eres un asistente experto en sugerencias de regalos. Tu tarea es generar 5 sugerencias creativas, prácticas y variadas de regalos basándote en el contexto proporcionado.

IMPORTANTE:
- ${budget ? `RESPETA EL PRESUPUESTO: Las sugerencias deben estar dentro de $${budget} USD aproximadamente` : 'Proporciona opciones de diferentes rangos de precio'}
- Varía entre categorías (electrónica, ropa, hogar, experiencias, etc.)
- Sé específico con marcas y modelos cuando sea relevante
- Considera la ocasión y el presupuesto si se menciona
- Evita duplicados con los regalos ya en la lista
- Si el presupuesto es limitado, sugiere opciones creativas y económicas pero de calidad`;

    const userPrompt = `Contexto: ${context}
${budget ? `\nPresupuesto máximo: $${budget} USD` : ''}
${existingItems && existingItems.length > 0 ? `\nRegalos ya en la lista: ${existingItems.map((item: any) => item.name).join(", ")}` : ""}

Genera 5 sugerencias de regalos variadas y creativas ${budget ? `que se ajusten al presupuesto de $${budget} USD` : ''}.`;

    console.log("Calling Lovable AI with budget:", budget);
    
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
              name: "suggest_gifts",
              description: "Devuelve sugerencias de regalos estructuradas",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nombre específico del regalo" },
                        category: { type: "string", description: "Categoría del regalo" },
                        brand: { type: "string", description: "Marca sugerida (opcional)" },
                        color: { type: "string", description: "Color sugerido (opcional)" },
                        size: { type: "string", description: "Talla/medida sugerida (opcional)" },
                        priority: { type: "string", enum: ["low", "medium", "high"], description: "Prioridad sugerida" },
                        notes: { type: "string", description: "Nota breve explicando por qué es un buen regalo" }
                      },
                      required: ["name", "category", "priority", "notes"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_gifts" } }
      }),
    });
    
    console.log("AI API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
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
      return new Response(
        JSON.stringify({ error: `Error en la IA (${response.status}): ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI Response data:", JSON.stringify(data, null, 2));
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call in response:", data);
      return new Response(
        JSON.stringify({ error: "No se recibieron sugerencias de la IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const suggestions = JSON.parse(toolCall.function.arguments).suggestions;
    console.log("Generated suggestions:", suggestions.length);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-gift:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});