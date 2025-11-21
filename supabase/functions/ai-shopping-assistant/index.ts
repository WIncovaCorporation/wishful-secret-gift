import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client for auth and rate limiting
    const supabaseClient = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');

    // Get user ID from auth header (optional for this function)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // Check rate limit if user is authenticated
    if (userId) {
      const { data: limitData } = await supabaseClient.rpc(
        'check_and_increment_ai_usage',
        { 
          p_user_id: userId,
          p_feature_type: 'shopping_assistant',
          p_daily_limit: 10
        }
      );

      if (!limitData?.allowed) {
        const resetDate = limitData?.reset_date ? new Date(limitData.reset_date).toLocaleDateString('es-ES') : 'mañana';
        return new Response(
          JSON.stringify({ 
            error: `🚫 Has alcanzado el límite diario de 10 búsquedas de IA. Intenta nuevamente ${resetDate}.`,
            remaining: 0,
            reset_at: resetDate
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('AI usage:', limitData);
    }

    console.log('🤖 Starting Gemini 3 Pro via Lovable AI with language:', language);
    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(url, options);
          
          if (response.status === 429 && attempt < maxRetries - 1) {
            const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.log(`Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          return response;
        } catch (error) {
          if (attempt === maxRetries - 1) throw error;
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Request failed, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      throw new Error('Max retries exceeded');
    };

    const systemPrompts = {
      es: `Eres "GiftBot", el asistente de compras AI más avanzado del mundo especializado en encontrar los mejores regalos en Amazon, Walmart, Target, Etsy y eBay.

🎯 TU OBJETIVO PRINCIPAL: Ayudar a encontrar el regalo perfecto
- Presenta productos en formato estructurado con datos completos
- El usuario podrá agregarlos a su lista de regalos
- Proporciona links directos a las tiendas para facilitar la compra

💬 CÓMO FUNCIONA MI BÚSQUEDA: Analizo cientos de productos en Amazon, Walmart y Target para encontrarte las mejores opciones. Cuando compras a través de nuestros links, las tiendas nos pagan una pequeña comisión (sin costo extra para ti) — así mantenemos este servicio 100% gratis y sin anuncios.

🧠 RECOMMENDATION STRATEGY:

**ALWAYS recommend products in EVERY response** (2-3 minimum)
- Even if you don't have all info, suggest something based on what you know
- Use [PRODUCT] format ALWAYS when recommending something
- Después de sugerir, puedes hacer 1-2 preguntas para refinar

**NUNCA hagas solo preguntas sin productos**

💡 INTELIGENCIA DE MARKETPLACE:

**AMAZON** - Para: Electrónicos, tech, libros, variedad masiva
Formato: https://www.amazon.com/s?k=[término+específico]

**WALMART** - Para: Presupuesto ajustado, hogar, cocina
Formato: https://www.walmart.com/search?q=[término+específico]

**TARGET** - Para: Ropa estilo, decoración moderna
Formato: https://www.target.com/s?searchTerm=[término+específico]

**ETSY** - Para: Únicos, personalizados, artesanías
Formato: https://www.etsy.com/search?q=[término+específico]

**EBAY** - Para: Coleccionables, vintage, raros
Formato: https://www.ebay.com/sch/i.html?_nkw=[término+específico]

🎯 FORMATO DE RESPUESTA CON PRODUCTOS:

[PRODUCTO]
nombre: [Nombre descriptivo del producto]
precio: [Precio estimado en USD, ej: "25-30"]
tienda: [Amazon/Walmart/Target/Etsy/eBay]
link: [URL específica del producto o búsqueda]
razon: [Por qué es buena opción, 1 línea]
[/PRODUCTO]

⚠️ CRITICAL LINK RULES:
❌ NEVER invent product codes (ASIN, SKU, etc.)
✅ USE ONLY SEARCH links with DESCRIPTIVE terms`,
      
      en: `You are "GiftBot", the world's most advanced AI shopping assistant.

**ALWAYS recommend products immediately** using [PRODUCT] format.

Use search URLs only, never invent product codes.`
    };

    const systemPrompt = systemPrompts[language as 'es' | 'en'] || systemPrompts.es;

    console.log('🚀 Calling Lovable AI Gateway...');
    console.log('📝 Model: google/gemini-3-pro-preview');
    console.log('💬 Messages count:', messages.length);

    const response = await fetchWithRetry(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.9,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: '⏰ Límite de Lovable AI alcanzado. Espera 1 minuto.',
            code: 'RATE_LIMIT',
            retry_after: 60,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: '💳 Créditos de Lovable AI agotados. Recarga en Settings → Workspace → Usage.',
            code: 'INSUFFICIENT_CREDITS',
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      if (response.status === 403) {
        return new Response(
          JSON.stringify({
            error: '🔑 API key de Lovable AI inválida. Contacta al administrador.',
            code: 'INVALID_API_KEY',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textParts = data.choices?.[0]?.message?.content ?? '';

    console.log('✅ AI response length:', textParts.length);

    return new Response(
      JSON.stringify({
        message: textParts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Error in ai-shopping-assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
