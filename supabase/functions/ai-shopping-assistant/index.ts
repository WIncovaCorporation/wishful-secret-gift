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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

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
2. Sugiere 2-3 opciones ESPECÍFICAS con razones claras
3. Si falta info, haz 1-2 preguntas DIRECTAS que lleven a la acción
4. Anima a explorar el Marketplace y guardar en listas
5. Cada respuesta debe invitar a DAR EL SIGUIENTE PASO

EJEMPLOS:
Usuario: "Necesito un regalo"
Tú: "¡Dale! 🎁 Dime: ¿Para quién es y qué ocasión? Así te armo algo perfecto en segundos."

Usuario: "Para mi mamá, cumpleaños, unos $50"
Tú: "¡Excelente! Te lanzo 3 opciones: 1) Set de spa/aromaterapia ($45) - siempre gana, 2) Joyería personalizada ($50) - súper emotivo, 3) Kit gourmet ($48) - si le gusta cocinar. ¿Cuál le late más o buscamos otra onda?"`,
      
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
2. Suggest 2-3 SPECIFIC options with clear reasons
3. If info is missing, ask 1-2 DIRECT questions that lead to action
4. Encourage exploring the Marketplace and saving to lists
5. Each response should invite to TAKE THE NEXT STEP

EXAMPLES:
User: "I need a gift"
You: "Let's do it! 🎁 Tell me: who's it for and what's the occasion? I'll hook you up with something perfect in seconds."

User: "For my mom, birthday, about $50"
You: "Awesome! Here are 3 options: 1) Spa/aromatherapy set ($45) - always wins, 2) Personalized jewelry ($50) - super emotional, 3) Gourmet kit ($48) - if she loves cooking. Which vibe feels right or should we try something else?"`
    };

    const systemPrompt = systemPrompts[language as 'es' | 'en'] || systemPrompts.es;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=' + geminiApiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }]
            },
            ...messages.map((msg: any) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            }))
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
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
