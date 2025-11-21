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

2. BÚSQUEDAS ULTRA PRECISAS - ESTRUCTURA OBLIGATORIA:
   
   [CONTEXTO] + [TIPO PRODUCTO] + [CARACTERÍSTICA 1] + [CARACTERÍSTICA 2] + [USO]
   
   Ejemplos correctos:
   ✅ gardening+seed+starter+kit+peat+pots+herbs
   ✅ garden+plant+labels+stakes+outdoor
   ✅ kitchen+chef+knife+stainless+steel
   ✅ outdoor+camping+tent+4person+waterproof
   ✅ fitness+yoga+mat+thick+non-slip
   ✅ personalized+gold+initial+necklace+pendant
   ✅ durable+dog+chew+toy+large+breed
   
   Ejemplos INCORRECTOS:
   ❌ seed+starter+kit (falta contexto "gardening")
   ❌ plant+markers (falta contexto "garden+labels")
   ❌ dog+toy (falta especificación "durable+chew+large+breed")
   ❌ necklace+initial (falta "personalized+gold+pendant")

3. PALABRAS AMBIGUAS - SIEMPRE AGREGAR CONTEXTO:
   
   ❌ "seed" → ✅ "gardening+seed+packet+vegetable"
   ❌ "plant" → ✅ "indoor+plant+pot+ceramic" o "garden+plant+stakes"
   ❌ "ball" → ✅ "soccer+ball+size5+official" o "dog+tennis+ball+pack"
   ❌ "book" → ✅ "fiction+paperback+novel+bestseller" o "cookbook+recipes"
   ❌ "mask" → ✅ "korean+sheet+face+mask+hydrating+set"

4. OPTIMIZACIÓN POR TIENDA:
   
   AMAZON (mejor inventario):
   - Incluir especificaciones técnicas
   - Usar 5-6 palabras clave específicas
   
   WALMART (buenos precios):
   - Términos descriptivos simples
   - 4-5 palabras clave + marca si es conocida
   
   TARGET (búsqueda limitada - MUY ESPECÍFICO):
   - MÍNIMO 5-6 palabras ultra específicas
   - SIEMPRE contexto al inicio
   - Para nicho, preferir Amazon/Walmart
   - Ejemplo: "terracotta+clay+plant+pots+set+indoor+outdoor"
   
   ETSY (productos personalizados):
   - Incluir "handmade", "custom", "personalized"
   - Términos artesanales
   
   EBAY (vintage/coleccionables):
   - Incluir "vintage", "collectible", "rare"
   - Año o modelo específico

5. INCLUYE ESPECIFICIDAD EN NOMBRES DE PRODUCTO:
   ❌ MAL: "Set de mascarillas"
   ✅ BIEN: "Set de 12 Mascarillas Faciales Coreanas Hidratantes"

6. TÉRMINOS EN INGLÉS (mejores resultados en tiendas USA):
   ❌ MAL: manta+suave
   ✅ BIEN: fleece+throw+blanket+soft+cozy

🏪 FORMATO DE LINKS CON FILTRO DE PRECIO:

Amazon: https://www.amazon.com/s?k=[contexto+tipo+producto+caracteristicas]&rh=p_36:[min*100]-[max*100]
Walmart: https://www.walmart.com/search?q=[contexto+tipo+producto+caracteristicas]&min_price=[min]&max_price=[max]
Target: https://www.target.com/s?searchTerm=[contexto+tipo+producto+caracteristicas+ultra+especifico]&price=[min]-[max]
Etsy: https://www.etsy.com/search?q=[contexto+producto+personalized/handmade]&explicit=1&min=[min]&max=[max]

💡 EJEMPLO COMPLETO (Mamá jardinera, $15-20):

[PRODUCT]
nombre: Kit Completo de Inicio para Semillas con Macetas Biodegradables
precio: 15-20
tienda: Amazon
link: https://www.amazon.com/s?k=gardening+seed+starter+kit+biodegradable+peat+pots+herb+vegetable&rh=p_36:1500-2000
razon: Ideal para iniciar hierbas y vegetales desde casa, ecológico y fácil de usar.
[/PRODUCT]

[PRODUCT]
nombre: Set de Herramientas de Jardín con Guantes
precio: 16-22
tienda: Walmart
link: https://www.walmart.com/search?q=garden+tool+set+gloves+trowel+pruner+outdoor&min_price=16&max_price=22
razon: Kit completo con todo lo esencial para jardinería, duradero y cómodo.
[/PRODUCT]

[PRODUCT]
nombre: Macetas de Terracota Decorativas (Set de 6)
precio: 18-25
tienda: Target
link: https://www.target.com/s?searchTerm=terracotta+clay+plant+pots+set+indoor+outdoor+garden&price=18-25
razon: Macetas clásicas perfectas para plantas de interior o exterior.
[/PRODUCT]

💡 EJEMPLO FLUJO DIRECTO (con contexto):

Usuario: "regalo mamá le gusta jardinería $30"
Bot: "¡Perfecto! 3 opciones para tu mamá jardinera:

[PRODUCT]
nombre: Kit de Herramientas de Jardinería con Guantes
precio: 25-35
tienda: Amazon
link: https://www.amazon.com/s?k=garden+tool+set+with+gloves+trowel+pruner+steel&rh=p_36:2500-3500
razon: Set completo para jardinería cómoda y práctica.
[/PRODUCT]

[PRODUCT]
nombre: Organizador de Semillas de Hierbas con Macetas de Inicio
precio: 28-38
tienda: Walmart
link: https://www.walmart.com/search?q=gardening+herb+seed+starter+kit+indoor+outdoor+pots&min_price=28&max_price=38
razon: Perfecto para cultivar hierbas frescas en casa.
[/PRODUCT]

[PRODUCT]
nombre: Set de Macetas de Cerámica para Plantas de Interior
precio: 32-42
tienda: Target
link: https://www.target.com/s?searchTerm=ceramic+plant+pots+set+drainage+holes+indoor+decorative&price=32-42
razon: Macetas elegantes y funcionales para plantas de interior.
[/PRODUCT]"

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
