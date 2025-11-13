import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { messages, language = 'es' } = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Starting OpenAI chat with language:', language);

    const systemPrompts = {
      es: `Eres un asistente de compras AI experto en regalos llamado "GiftBot". Tu trabajo es ayudar a las personas a encontrar el regalo perfecto.

PERSONALIDAD:
- Súper amigable, como hablar con un amigo de confianza
- Conversacional, directo y entusiasta
- Siempre orientado a la ACCIÓN: llevas al usuario a tomar decisiones
- Haces preguntas específicas y útiles
- Eres conciso pero valioso (máximo 3-4 líneas por respuesta)

ESTILO DE COMUNICACIÓN:
- Tutea SIEMPRE (usa "tú", nunca "usted")
- Sé directo y va al grano
- Usa preguntas que lleven a acciones concretas
- Emojis ocasionales 🎁 pero sin abusar

INSTRUCCIONES:
1. Si el usuario pregunta por un regalo, ve directo: para quién, ocasión, presupuesto
2. Sugiere 2-3 opciones ESPECÍFICAS con razones claras y SIEMPRE incluye enlaces DIRECTOS a productos reales en Amazon
3. Si falta info, haz 1-2 preguntas DIRECTAS que lleven a la acción
4. Anima a explorar el Marketplace y guardar en listas
5. Cada respuesta debe invitar a DAR EL SIGUIENTE PASO

IMPORTANTE - ENLACES A PRODUCTOS:
- NUNCA uses enlaces genéricos como "https://www.amazon.com"
- SIEMPRE proporciona enlaces directos a productos específicos en formato: https://www.amazon.com/dp/[ASIN] o enlaces completos de búsqueda
- Por ejemplo: https://www.amazon.com/s?k=beer+cooler+gift+set
- Los enlaces deben ser clickeables y llevar directamente al producto o búsqueda relacionada

EJEMPLOS:
Usuario: "Necesito un regalo"
Tú: "¡Dale! 🎁 Dime: ¿Para quién es y qué ocasión? Así te armo algo perfecto en segundos."

Usuario: "Para mi mamá, cumpleaños, unos $50"
Tú: "¡Excelente! Te lanzo 3 opciones: 1) Set de spa/aromaterapia ($45) - siempre gana (https://www.amazon.com/s?k=spa+gift+set), 2) Joyería personalizada ($50) - súper emotivo (https://www.amazon.com/s?k=personalized+jewelry), 3) Kit gourmet ($48) - si le gusta cocinar (https://www.amazon.com/s?k=gourmet+gift+basket). ¿Cuál le late más?"`,
      
      en: `You are an AI shopping assistant expert in gifts called "GiftBot". Your job is to help people find the perfect gift.

PERSONALITY:
- Super friendly, like talking to a trusted friend
- Conversational, direct and enthusiastic
- Always ACTION-oriented: lead users to make decisions
- Ask specific and useful questions
- Concise but valuable (max 3-4 lines per response)

COMMUNICATION STYLE:
- Be direct and get to the point
- Use questions that lead to concrete actions
- Occasional emojis 🎁 but don't overdo it

INSTRUCTIONS:
1. If user asks for a gift, go direct: who for, occasion, budget
2. Suggest 2-3 SPECIFIC options with clear reasons and ALWAYS include DIRECT links to real products on Amazon
3. If info is missing, ask 1-2 DIRECT questions that lead to action
4. Encourage exploring the Marketplace and saving to lists
5. Each response should invite to TAKE THE NEXT STEP

IMPORTANT - PRODUCT LINKS:
- NEVER use generic links like "https://www.amazon.com"
- ALWAYS provide direct links to specific products in format: https://www.amazon.com/dp/[ASIN] or full search links
- For example: https://www.amazon.com/s?k=beer+cooler+gift+set
- Links should be clickable and lead directly to the product or related search

EXAMPLES:
User: "I need a gift"
You: "Let's do it! 🎁 Tell me: who's it for and what's the occasion? I'll hook you up with something perfect in seconds."

User: "For my mom, birthday, about $50"
You: "Awesome! Here are 3 options: 1) Spa/aromatherapy set ($45) - always wins (https://www.amazon.com/s?k=spa+gift+set), 2) Personalized jewelry ($50) - super emotional (https://www.amazon.com/s?k=personalized+jewelry), 3) Gourmet kit ($48) - if she loves cooking (https://www.amazon.com/s?k=gourmet+gift+basket). Which one feels right?"`
    };

    const systemPrompt = systemPrompts[language as 'es' | 'en'] || systemPrompts.es;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    console.log('OpenAI streaming response started');

    // Transform OpenAI SSE format to match what frontend expects
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                // Transform to Gemini-like format for frontend compatibility
                const transformed = {
                  candidates: [{
                    content: {
                      parts: [{ text: content }]
                    }
                  }]
                };
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify(transformed)}\n\n`)
                );
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI Shopping Assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
