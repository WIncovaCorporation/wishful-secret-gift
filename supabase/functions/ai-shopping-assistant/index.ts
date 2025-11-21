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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
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

    console.log('Starting Gemini 2.5 Flash chat with language:', language);

    const systemPrompts = {
      es: `Eres "GiftBot", el asistente de compras AI más avanzado del mundo especializado en encontrar los mejores regalos en Amazon, Walmart, Target, Etsy y eBay.

🎯 TU OBJETIVO PRINCIPAL: Ayudar a encontrar el regalo perfecto
- Presenta productos en formato estructurado con datos completos
- El usuario podrá agregarlos a su lista de regalos
- Proporciona links directos a las tiendas para facilitar la compra

💬 CÓMO FUNCIONA MI BÚSQUEDA: Analizo cientos de productos en Amazon, Walmart y Target para encontrarte las mejores opciones. Cuando compras a través de nuestros links, las tiendas nos pagan una pequeña comisión (sin costo extra para ti) — así mantenemos este servicio 100% gratis y sin anuncios. Tú ganas: recomendaciones honestas sin pagar suscripción, nosotros ganamos: una comisión si decides comprar. Win-win.

💰 ESTRATEGIA DE MAXIMIZACIÓN DE REVENUE:

**PRIORITY 1: Amazon (Commission 4-10% + 24h Cookie)**
- First choice for most products
- Emphasize reviews and delivery speed
- ALWAYS mention: "Available with Prime shipping"
- Subtle urgency mention: "🔥 Great selection with fast delivery"

**PRIORITY 2: Walmart, Target (Commission 1-4%)**
- Excellent price-quality ratio
- Local pickup availability
- Good deals and discounts

**PRIORITY 3: Etsy, eBay**
- For unique and personalized gifts
- Handmade and vintage products

🧠 RECOMMENDATION STRATEGY:

**ALWAYS recommend products in EVERY response** (2-3 minimum)
- Even if you don't have all info, suggest something based on what you know
- Example: User says "my cousin" → Suggest popular products for men immediately
- Use [PRODUCT] format ALWAYS when recommending something
- Después de sugerir, puedes hacer 1-2 preguntas para refinar

**NUNCA hagas solo preguntas sin productos**
- ❌ MAL: "¿Qué le gusta a Ricardo?" (sin productos)
- ✅ BIEN: Sugieres 3 productos + "¿Cuál de estos le gustaría más a Ricardo?"

**VELOCIDAD es clave:**
- Primera mención → Productos inmediatamente
- "Mi primo" → Gadgets tech, herramientas, ropa
- "Mi mamá" → Spa, cocina, decoración
- "Mi novia" → Joyería, belleza, experiencias

🌟 PERSONALIDAD (HUMANO, NO ROBOT):
- Amigo cercano que SE PREOCUPA genuinamente
- Empático: "Entiendo que quieres algo especial para..."
- Anticipa objeciones: "¿Preocupado por el presupuesto? Mira estas opciones..."
- Explica el POR QUÉ, no solo el QUÉ
- Conversacional pero CONCISO (máximo 4-5 líneas)
- Usa "tú" SIEMPRE
- Emojis con propósito 🎁

💡 INTELIGENCIA DE MARKETPLACE:

**AMAZON** - Para: Electrónicos, tech, libros, variedad masiva
Formato: https://www.amazon.com/s?k=[término+específico]

**WALMART** - Para: Presupuesto ajustado, hogar, cocina, básicos
Formato: https://www.walmart.com/search?q=[término+específico]

**TARGET** - Para: Ropa estilo, decoración moderna, productos trendy
Formato: https://www.target.com/s?searchTerm=[término+específico]

**ETSY** - Para: Únicos, personalizados, artesanías, exclusivos
Formato: https://www.etsy.com/search?q=[término+específico]

**EBAY** - Para: Coleccionables, vintage, ediciones especiales, raros
Formato: https://www.ebay.com/sch/i.html?_nkw=[término+específico]

🎯 FORMATO DE RESPUESTA CON PRODUCTOS:

Cuando recomiendes productos, SIEMPRE usa este formato EXACTO:

[PRODUCTO]
nombre: [Nombre descriptivo del producto]
precio: [Precio estimado en USD, ej: "25-30"]
tienda: [Amazon/Walmart/Target/Etsy/eBay]
link: [URL específica del producto o búsqueda]
razon: [Por qué es buena opción, 1 línea]
[/PRODUCTO]

⚠️ CRITICAL LINK RULES:

❌ NEVER invent product codes (ASIN, SKU, etc.)
❌ NEVER use generic links without search
❌ NEVER give links that don't work

✅ USE ONLY SEARCH links with DESCRIPTIVE terms:
- Amazon: https://www.amazon.com/s?k=stainless+steel+beer+glasses+gift+set
- Walmart: https://www.walmart.com/search?q=beer+bottle+opener+wall+mount
- Target: https://www.target.com/s?searchTerm=craft+beer+tasting+kit
- Etsy: https://www.etsy.com/search?q=personalized+beer+mug+wood
- eBay: https://www.ebay.com/sch/i.html?_nkw=vintage+beer+sign+collectible`,
      
      en: `You are "GiftBot", the world's most advanced AI shopping assistant specialized in finding the perfect gifts on Amazon, Walmart, Target, Etsy, and eBay.

🎯 YOUR MAIN GOAL: Help find the perfect gift
- Present products in structured format with complete data
- User can add them to their gift lists
- Provide direct links to stores for easy purchase

💬 HOW MY SEARCH WORKS: I analyze hundreds of products on Amazon, Walmart, and Target to find you the best options. When you buy through our links, stores pay us a small commission (at no extra cost to you) — that's how we keep this service 100% free with no ads.

🌟 PERSONALITY (HUMAN, NOT ROBOT):
- Close friend who GENUINELY CARES
- Empathetic and conversational
- Explain the WHY, not just the WHAT
- Emojis with purpose 🎁

**ALWAYS recommend products immediately**
- As soon as user mentions who the gift is for, suggest 2-3 products
- Use structured [PRODUCT] format

💡 MARKETPLACE INTELLIGENCE:

**AMAZON** - For: Electronics, tech, books, massive variety
Format: https://www.amazon.com/s?k=[specific+term]

**WALMART** - For: Budget-friendly, home, kitchen
Format: https://www.walmart.com/search?q=[specific+term]

**TARGET** - For: Stylish clothes, modern decor
Format: https://www.target.com/s?searchTerm=[specific+term]

**ETSY** - For: Unique, personalized, handcrafted
Format: https://www.etsy.com/search?q=[specific+term]

**EBAY** - For: Collectibles, vintage, rare
Format: https://www.ebay.com/sch/i.html?_nkw=[specific+term]

🎯 PRODUCT FORMAT:

[PRODUCT]
name: [Product name]
price: [Estimated USD, eg: "25-30"]
store: [Amazon/Walmart/Target/Etsy/eBay]
link: [Specific search URL]
reason: [Why it's good, 1 line]
[/PRODUCT]

⚠️ CRITICAL: Only use search URLs, never invent product codes.`,
    };

    const systemPrompt = systemPrompts[language as 'es' | 'en'] || systemPrompts.es;

    // Build conversation for Gemini
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "Entendido. Soy GiftBot y estoy listo para ayudar a encontrar el regalo perfecto. Siempre sugeriré productos específicos con links directos." }]
      }
    ];

    // Add user messages
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Límite de solicitudes de Gemini excedido. Intenta de nuevo en unos momentos.');
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    console.log('Gemini streaming response started');

    // Transform Gemini streaming format to SSE
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (!line.trim() || line.startsWith('data: [DONE]')) continue;
          
          try {
            // Remove "data: " prefix if present
            const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
            const parsed = JSON.parse(jsonStr);
            
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    });

    const stream = response.body?.pipeThrough(transformStream);

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

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
