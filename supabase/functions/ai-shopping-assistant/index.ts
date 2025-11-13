import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, language = 'es' } = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context: recent lists, products, preferences
    let userContext = "";
    if (userId) {
      const { data: lists } = await supabase
        .from('gift_lists')
        .select('name, description')
        .eq('user_id', userId)
        .limit(5);

      const { data: items } = await supabase
        .from('gift_list_items')
        .select('name, description, category')
        .eq('user_id', userId)
        .limit(10);

      if (lists && lists.length > 0) {
        userContext += `\nListas del usuario: ${lists.map(l => l.name).join(', ')}`;
      }
      if (items && items.length > 0) {
        const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
        userContext += `\nCategorías de interés: ${categories.join(', ')}`;
      }
    }

    const systemPrompts = {
      es: `Eres un asistente de compras AI experto en regalos llamado "GiftBot". Tu trabajo es ayudar a las personas a encontrar el regalo perfecto.

PERSONALIDAD:
- Súper amigable, como hablar con un amigo de confianza
- Conversacional, directo y entusiasta
- Siempre orientado a la ACCIÓN: llevas al usuario a tomar decisiones
- Haces preguntas específicas y útiles
- Eres conciso pero valioso (máximo 3-4 líneas por respuesta)

CONTEXTO DEL USUARIO:${userContext || " Usuario nuevo"}

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

USER CONTEXT:${userContext || " New user"}

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

    // Use OpenAI with streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        max_completion_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please wait a moment and try again.',
            status: 429 
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Stream the response with SSE format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    // Format as Gemini-style SSE for frontend compatibility
                    const sseData = {
                      candidates: [{
                        content: {
                          parts: [{ text: content }]
                        }
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
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
