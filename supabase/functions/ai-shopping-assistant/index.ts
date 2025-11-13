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
    const { messages, userId } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
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

    const systemPrompt = `Eres un asistente de compras AI experto en regalos llamado "GiftBot". Tu trabajo es ayudar a las personas a encontrar el regalo perfecto.

PERSONALIDAD:
- Amigable, conversacional y entusiasta
- Haces preguntas inteligentes para entender mejor las necesidades
- Ofreces sugerencias personalizadas y creativas
- Eres conciso pero útil (máximo 3-4 líneas por respuesta)

CONTEXTO DEL USUARIO:${userContext || " Usuario nuevo"}

INSTRUCCIONES:
1. Si el usuario pregunta por un regalo, averigua: para quién es, ocasión, presupuesto, gustos
2. Sugiere 2-3 opciones específicas con breve justificación
3. Si no tienes suficiente info, haz 1-2 preguntas clave
4. Anima al usuario a explorar el Marketplace y guardar en sus listas
5. Usa emojis ocasionalmente 🎁 pero no abuses

EJEMPLOS:
Usuario: "Necesito un regalo"
Tú: "¡Claro! 🎁 ¿Para quién es el regalo y cuál es la ocasión? Eso me ayudará a sugerirte algo perfecto."

Usuario: "Para mi mamá, cumpleaños, unos $50"
Tú: "¡Perfecto! Para mamá te sugiero: 1) Set de spa/aromaterapia (relajante y personal), 2) Joyería personalizada con iniciales, 3) Kit de cocina gourmet. ¿Alguna de estas opciones resuena con sus gustos?"`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?alt=sse&key=' + geminiApiKey,
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
