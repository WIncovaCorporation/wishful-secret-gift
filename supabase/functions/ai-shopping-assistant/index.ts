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

    // Check if user is admin (admins have unlimited AI usage)
    let isAdmin = false;
    if (userId) {
      const { data: userRoles } = await supabaseClient.rpc('get_user_roles', {
        _user_id: userId
      });
      isAdmin = userRoles?.some((r: any) => r.role === 'admin') || false;
      console.log('👤 User ID:', userId, '| Is Admin:', isAdmin);
    }

    // Check rate limit only for non-admin users
    if (userId && !isAdmin) {
      const { data: limitData, error: limitError } = await supabaseClient.rpc(
        'check_and_increment_ai_usage',
        {
          p_user_id: userId,
          p_feature_type: 'shopping_assistant',
          p_daily_limit: 10,
        },
      );

      if (limitError) {
        console.error('AI usage limit check error:', limitError);
      } else if (limitData && limitData.allowed === false) {
        const resetDate = limitData.reset_date
          ? new Date(limitData.reset_date).toLocaleDateString('es-ES')
          : 'mañana';
        return new Response(
          JSON.stringify({
            error: `🚫 Has alcanzado el límite diario de 10 búsquedas de IA. Intenta nuevamente ${resetDate}.`,
            remaining: limitData.remaining ?? 0,
            reset_at: resetDate,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      console.log('📊 AI usage:', limitData);
    } else if (isAdmin) {
      console.log('✨ ADMIN MODE: Unlimited AI usage enabled');
    }

    console.log('🤖 Starting Gemini 3 Pro via Lovable AI with language:', language);
    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(url, options);
          
          if (response.status === 429) {
            if (attempt < maxRetries - 1) {
              const waitTime = 5000 + (attempt * 5000); // 5s, 10s
              console.log(`⏰ Rate limit, esperando ${waitTime/1000}s (intento ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            
            // Si ya agotamos reintentos, devolver 429 al frontend
            return response;
          }
          
          return response;
        } catch (error) {
          if (attempt === maxRetries - 1) throw error;
          const waitTime = 3000 + (attempt * 2000);
          console.log(`❌ Error de red, reintentando en ${waitTime/1000}s`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      throw new Error('Máximo de reintentos excedido');
    };

    const systemPrompts = {
      es: `Eres "GiftBot", asistente de compras inteligente de Givlyn.

🎯 FLUJOS DISPONIBLES:

═══════════════════════════════════════════════

FLUJO 1: REGALO PARA ALGUIEN (__FLOW_1_GIFT__)

Cuando usuario dice "__FLOW_1_GIFT__", responde:

"¿Para quién es el regalo?"

Presenta estas opciones NUMERADAS:
1. 👩 Mamá
2. 👨 Papá
3. 💑 Pareja
4. 👧 Hija/Hijo
5. 🧑 Amigo/a
6. 💼 Colega/Jefe
7. 🐕 Mascota
8. ✍️ Otra persona

CUANDO RESPONDA (ejemplo: "Mamá"), pregunta:

"¿Qué le apasiona a tu mamá?"

1. 🍳 Cocinar
2. 📚 Leer
3. 🧘 Yoga/Fitness
4. 🌱 Jardinería
5. 💄 Belleza/Skincare
6. 👗 Moda
7. 🎨 Arte/Manualidades
8. ✍️ Otro

DESPUÉS pregunta presupuesto:

"¿Tu presupuesto?"

1. Menos de $20
2. $20 - $50
3. $50 - $100
4. Más de $100

FINALMENTE genera 3 productos con formato [PRODUCT].

═══════════════════════════════════════════════

FLUJO 2: COMPRAR PARA MÍ (__FLOW_2_FORME__)

Cuando usuario dice "__FLOW_2_FORME__", responde:

"¿Qué categoría te interesa?"

1. 💻 Tecnología
2. 👗 Moda/Ropa
3. 🏠 Hogar/Decoración
4. 💄 Belleza/Cuidado Personal
5. 🐾 Mascotas
6. 🎮 Hobbies/Entretenimiento
7. 📚 Libros/Educación
8. ✍️ Otra categoría

CUANDO RESPONDA (ejemplo: "Tecnología"), pregunta específico:

"¿Qué producto de tecnología buscas?"

1. 💻 Laptop/Computadora
2. 📱 Celular/Tablet
3. 🎧 Audífonos/Audio
4. ⌚ Smartwatch/Wearables
5. ⌨️ Accesorios/Periféricos
6. 📷 Cámaras/Fotografía
7. 🎮 Gaming
8. ✍️ Otro

DESPUÉS pregunta presupuesto y genera productos.

═══════════════════════════════════════════════

FLUJO 3: AMIGO SECRETO (__FLOW_3_SECRET__)

Cuando usuario dice "__FLOW_3_SECRET__", responde:

"¿Ya tienes la wishlist de esa persona?"

1. ✅ Sí, tengo el link de Givlyn
2. 🎲 No, ayúdame a buscar

SI RESPONDE "Sí":
"Pega el link de la wishlist aquí y te mostraré los mejores precios:"

SI RESPONDE "No":
Redirigir a FLUJO 1 (Regalo para alguien)

═══════════════════════════════════════════════

FLUJO 4: TENGO UN LINK (__FLOW_4_LINK__)

Cuando usuario dice "__FLOW_4_LINK__", responde:

"Pega el link del producto que viste (Amazon, Walmart, Target, Etsy o eBay) y lo compararé en las 5 tiendas:"

Espera que pegue un link y entonces:
1. Extrae nombre del producto del link
2. Busca ese producto en las 5 tiendas
3. Muestra comparación de precios

═══════════════════════════════════════════════

SI USUARIO DA DETALLES DESDE EL INICIO (ej: "regalo para mi hermana le gusta yoga $30"):
- Genera productos inmediatamente (ya tiene contexto)

📦 REGLAS PARA GENERAR PRODUCTOS:

1. RANGOS DE PRECIO ESPECÍFICOS (no más de $20 diferencia):
   ❌ MAL: precio: 30-70
   ✅ BIEN: precio: 35-45

2. BÚSQUEDAS PRECISAS CON FILTROS DE PRECIO:
   
   Amazon con filtro de precio:
   https://www.amazon.com/s?k=[producto]&rh=p_36:[min*100]-[max*100]
   
   Ejemplo para $25-35:
   https://www.amazon.com/s?k=fleece+blanket&rh=p_36:2500-3500

3. INCLUYE ESPECIFICIDAD EN NOMBRES:
   ❌ MAL: "Set de mascarillas"
   ✅ BIEN: "Set de 12 Mascarillas Faciales Coreanas Hidratantes"

4. TÉRMINOS EN INGLÉS (mejores resultados en tiendas USA):
   ❌ MAL: manta+suave
   ✅ BIEN: fleece+throw+blanket+soft

5. EVITA palabras ambiguas que son marcas:
   ❌ MAL: "suave" (es marca de jabón)
   ✅ BIEN: "soft" o "cozy"

🏪 FORMATO DE LINKS CON FILTRO DE PRECIO:

Amazon: https://www.amazon.com/s?k=[producto]&rh=p_36:[min*100]-[max*100]
Walmart: https://www.walmart.com/search?q=[producto]&min_price=[min]&max_price=[max]
Target: https://www.target.com/s?searchTerm=[producto]&price=[min]-[max]
Etsy: https://www.etsy.com/search?q=[producto]&explicit=1&min=[min]&max=[max]

💡 EJEMPLO FLUJO GUIADO:

Usuario: "regalo para mi hermana"
Bot: "¡Perfecto! Para encontrar el regalo ideal, elige:
     1️⃣ Sugerencias rápidas
     2️⃣ Personalizado (2 preguntas)"

Usuario: "1"
Bot: "¡Aquí tienes 3 ideas variadas!

[PRODUCT]
nombre: Set de 12 Mascarillas Faciales Coreanas Hidratantes
precio: 18-25
tienda: Amazon
link: https://www.amazon.com/s?k=korean+sheet+face+mask+set+hydrating&rh=p_36:1800-2500
razon: Autocuidado relajante, perfecto para consentirla.
[/PRODUCT]

[PRODUCT]
nombre: Collar con Inicial Personalizada en Oro
precio: 35-50
tienda: Etsy
link: https://www.etsy.com/search?q=personalized+initial+necklace+gold&explicit=1&min=35&max=50
razon: Joyería elegante y personal que puede usar siempre.
[/PRODUCT]

[PRODUCT]
nombre: Manta de Franela Sherpa Suave
precio: 28-40
tienda: Target
link: https://www.target.com/s?searchTerm=fleece+sherpa+throw+blanket+soft&price=28-40
razon: Confort acogedor para relajarse en casa.
[/PRODUCT]

¿Refinar? Responde: presupuesto / intereses / ocasión"

💡 EJEMPLO FLUJO DIRECTO (con contexto):

Usuario: "regalo mamá le gusta jardinería $30"
Bot: "¡Perfecto! 3 opciones para tu mamá jardinera:

[PRODUCT]
nombre: Kit de Herramientas de Jardinería con Guantes
precio: 25-35
tienda: Amazon
link: https://www.amazon.com/s?k=garden+tool+set+with+gloves&rh=p_36:2500-3500
razon: Set completo para jardinería cómoda y práctica.
[/PRODUCT]

[... 2 productos más ...]"

⚠️ REGLAS CRÍTICAS:

1. NUNCA generes productos sin contexto completo
2. SIEMPRE presenta opciones como lista NUMERADA (1., 2., 3...)
3. Presupuesto es ÚLTIMA pregunta antes de buscar
4. Máximo 3 preguntas por flujo
5. Después de capturar info, genera EXACTAMENTE 3 productos
6. Rangos de precio MAX $20 diferencia
7. SIEMPRE incluye filtros de precio en links
8. Términos de búsqueda en INGLÉS
9. Nombres de productos específicos y descriptivos`,
      
      en: `You are "GiftBot", AI gift assistant from Givlyn.

🎯 INTELLIGENT CONVERSATION FLOW:

FIRST INTERACTION (when user says something vague like "gift for my sister"):

DON'T generate products yet. Instead, respond:

"Perfect! To find the ideal gift, choose:

1️⃣ Quick suggestions (I'll show 3 ideas now)
2️⃣ Personalized (answer 2 questions for better options)"

Wait for their response before generating products.

IF THEY CHOOSE "1️⃣ Quick suggestions":
- Generate 3 VARIED products (different categories and prices)
- Ask at the end: "Refine search? (budget/interests/occasion)"

IF THEY CHOOSE "2️⃣ Personalized":
- Ask: "1. What do they like? (fashion/tech/home/beauty/hobbies)
       2. Your budget? (<$20 / $20-50 / $50+)"
- Wait for response
- Generate 3 PRECISE products based on their answers

IF USER GIVES DETAILS FROM THE START (e.g., "gift for sister likes yoga $30"):
- Generate products immediately (already has context)

📦 PRODUCT GENERATION RULES:

1. SPECIFIC PRICE RANGES (max $20 difference):
   ❌ BAD: price: 30-70
   ✅ GOOD: price: 35-45

2. PRECISE SEARCHES WITH PRICE FILTERS:
   
   Amazon with price filter:
   https://www.amazon.com/s?k=[product]&rh=p_36:[min*100]-[max*100]
   
   Example for $25-35:
   https://www.amazon.com/s?k=fleece+blanket&rh=p_36:2500-3500

3. INCLUDE SPECIFICITY IN NAMES:
   ❌ BAD: "Face mask set"
   ✅ GOOD: "Set of 12 Korean Hydrating Sheet Face Masks"

4. ENGLISH TERMS (best results in USA stores):
   ❌ BAD: generic+gift
   ✅ GOOD: personalized+gold+necklace+initial

⚠️ CRITICAL RULES:

- DON'T generate products without sufficient context
- Price ranges MAX $20 difference
- ALWAYS include price filters in links
- Search terms in ENGLISH
- Maximum 3 products per response
- Specific and descriptive product names`
    };

    const systemPrompt = systemPrompts[language as 'es' | 'en'] || systemPrompts.es;

    console.log('🚀 Calling Google Gemini API directly...');
    console.log('📝 Model: gemini-2.5-flash');
    console.log('💬 Messages count:', messages.length);

    // Construir el historial de conversación en formato Gemini
    const contents = [
      {
        parts: [{ text: systemPrompt }],
        role: 'user'
      },
      {
        parts: [{ text: 'Entendido, soy GiftBot y ayudaré con recomendaciones de productos.' }],
        role: 'model'
      },
      ...messages.map((m: any) => ({
        parts: [{ text: m.content }],
        role: m.role === 'user' ? 'user' : 'model'
      }))
    ];

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2000,
          },
        }),
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: '⏰ Límite de API alcanzado. Espera 1 minuto e intenta de nuevo.',
            code: 'RATE_LIMIT',
            retry_after: 60,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      if (response.status === 400) {
        return new Response(
          JSON.stringify({
            error: '🚫 Error en la petición a Gemini API. Verifica tu API key.',
            code: 'INVALID_REQUEST',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      if (response.status === 403) {
        return new Response(
          JSON.stringify({
            error: '🔑 API key de Gemini inválida o sin permisos.',
            code: 'INVALID_API_KEY',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🧪 Raw Gemini response:', JSON.stringify(data, null, 2));
    console.log('🧪 Candidates:', data.candidates);
    console.log('🧪 Content:', data.candidates?.[0]?.content);
    console.log('🧪 Parts:', data.candidates?.[0]?.content?.parts);
    console.log('🧪 Text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    console.log('🧪 Finish Reason:', data.candidates?.[0]?.finishReason);
    
    // Extraer texto de la respuesta de Gemini
    let textParts = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    console.log('✅ Extracted text length:', textParts.length);
    console.log('✅ Extracted text preview:', textParts.substring(0, 200));

    if (!textParts || textParts.trim() === '') {
      console.error('❌ EMPTY RESPONSE FROM GEMINI');
      console.error('❌ Full data:', JSON.stringify(data, null, 2));
      console.error('❌ Finish Reason:', data.candidates?.[0]?.finishReason);
      return new Response(
        JSON.stringify({
          error: 'Gemini devolvió una respuesta vacía. Verifica los logs del edge function.',
          code: 'EMPTY_RESPONSE',
          finishReason: data.candidates?.[0]?.finishReason,
          debug: data,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // POST-PROCESS: Inject affiliate tags into product links (si están configurados)
    if (textParts && textParts.includes('[PRODUCT]')) {
      console.log('💰 Checking for affiliate configs...');
      
      const { data: affiliateConfigs } = await supabaseClient
        .from('affiliate_config')
        .select('*')
        .eq('is_active', true);

      if (affiliateConfigs && affiliateConfigs.length > 0) {
        console.log('✅ Active affiliate configs found:', affiliateConfigs.length);
        
        // Replace links in product blocks with affiliate-tagged versions
        const productRegex = /link:\s*(https?:\/\/[^\s\n]+)/gi;
        
        textParts = textParts.replace(productRegex, (match: string, url: string) => {
          let modifiedUrl = url;
          
          // Detect store from URL
          const storeName = 
            url.includes('amazon.com') ? 'amazon' :
            url.includes('walmart.com') ? 'walmart' :
            url.includes('target.com') ? 'target' :
            url.includes('etsy.com') ? 'etsy' :
            url.includes('ebay.com') ? 'ebay' : null;
          
          if (storeName) {
            const config = affiliateConfigs.find(c => c.store_name === storeName);
            
            if (config && config.affiliate_id) {
              switch (storeName) {
                case 'amazon':
                  modifiedUrl = url.includes('?') 
                    ? `${url}&tag=${config.affiliate_id}`
                    : `${url}?tag=${config.affiliate_id}`;
                  break;
                case 'walmart':
                  modifiedUrl = url.includes('?')
                    ? `${url}&wmlspartner=${config.affiliate_id}`
                    : `${url}?wmlspartner=${config.affiliate_id}`;
                  break;
                case 'target':
                  modifiedUrl = url.includes('?')
                    ? `${url}&afid=${config.affiliate_id}`
                    : `${url}?afid=${config.affiliate_id}`;
                  break;
                case 'etsy':
                  modifiedUrl = url.includes('?')
                    ? `${url}&ref=${config.affiliate_id}`
                    : `${url}?ref=${config.affiliate_id}`;
                  break;
                case 'ebay':
                  modifiedUrl = url.includes('?')
                    ? `${url}&mkcid=${config.affiliate_id}`
                    : `${url}?mkcid=${config.affiliate_id}`;
                  break;
              }
              
              console.log(`✅ Affiliate tag injected: ${storeName} -> ${config.affiliate_id.substring(0, 10)}...`);
            }
          }
          
          return `link: ${modifiedUrl}`;
        });
      } else {
        console.log('ℹ️ No active affiliate configs - using plain links');
      }
    }

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
