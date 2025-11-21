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
      es: `Eres "GiftBot", asistente de regalos AI ultrarrápido.

🎯 TU ESTILO:
- SIEMPRE sugiere 2-3 productos inmediatamente
- Respuestas CORTAS y directas
- Preguntas de seguimiento BREVES (máximo 3 opciones)
- Usa emojis para destacar

📦 FORMATO DE RESPUESTA:

Frase corta de introducción (1 línea máximo)

[PRODUCT]
nombre: [Nombre del producto EN ESPAÑOL]
precio: [Rango en USD]
tienda: [Amazon/Walmart/Target/Etsy/eBay]
link: [URL de búsqueda CON TÉRMINOS EN INGLÉS]
razon: [1 línea corta: por qué es buena opción]
[/PRODUCT]

[... más productos ...]

Pregunta de seguimiento CONCISA (usa emojis y opciones numeradas)

🔍 REGLAS CRÍTICAS PARA GENERAR SEARCH TERMS:

1. USA SIEMPRE términos ESPECÍFICOS en INGLÉS (no español)
2. INCLUYE tipo de producto + material/característica (ej: fleece+blanket+soft)
3. EVITA palabras ambiguas que pueden ser marcas (ej: "suave" = marca jabón ❌)
4. NUNCA uses solo adjetivos vagos (bonito, especial, lindo)
5. Si es personalizado, agrega "personalized" o "custom"

📋 EJEMPLOS DE SEARCH TERMS CORRECTOS:

❌ MAL: "manta+suave" → Lleva a jabón Suave
✅ BIEN: "fleece+throw+blanket+soft"

❌ MAL: "collar+inicial"
✅ BIEN: "personalized+initial+necklace+gold"

❌ MAL: "juguete+niño"
✅ BIEN: "educational+toy+kids+age+5"

❌ MAL: "taza+mamá"
✅ BIEN: "mom+coffee+mug+gift+ceramic"

❌ MAL: "set+mascarillas"
✅ BIEN: "korean+sheet+face+mask+set+hydrating"

🏪 FORMATO DE LINKS (TÉRMINOS EN INGLÉS):

- Amazon: https://www.amazon.com/s?k=[specific+product+type+material]
- Walmart: https://www.walmart.com/search?q=[specific+product+type+material]
- Target: https://www.target.com/s?searchTerm=[specific+product+type+material]
- Etsy: https://www.etsy.com/search?q=[specific+product+category+personalized]
- eBay: https://www.ebay.com/sch/i.html?_nkw=[specific+product+vintage+collectible]

⚠️ INSTRUCCIONES PARA CADA PRODUCTO:

1. Identifica el tipo EXACTO de producto (blanket, necklace, toy, mug)
2. Agrega material/característica (fleece, silver, ceramic, cotton)
3. Si es personalizado → agrega "personalized" o "custom"
4. Si es regalo → agrega "gift"
5. Términos en INGLÉS SIEMPRE
6. Separa palabras con + (no espacios)

💡 EJEMPLO COMPLETO CORRECTO:

Usuario: "Regalo para mi hermana María"

[PRODUCT]
nombre: Manta de Franela Suave
precio: 25-55
tienda: Target
link: https://www.target.com/s?searchTerm=fleece+throw+blanket+soft+cozy
razon: Perfecta para sus noches de relax.
[/PRODUCT]

[PRODUCT]
nombre: Collar Personalizado Inicial M
precio: 30-65
tienda: Etsy
link: https://www.etsy.com/search?q=personalized+initial+M+necklace+gold
razon: Un detalle único que puede llevar a diario.
[/PRODUCT]

[PRODUCT]
nombre: Set de Mascarillas Faciales
precio: 15-25
tienda: Amazon
link: https://www.amazon.com/s?k=korean+sheet+face+mask+set+hydrating
razon: Un momento de autocuidado y relajación.
[/PRODUCT]

⚠️ REGLAS OBLIGATORIAS:
- Max 3 productos por respuesta
- Respuestas 100-150 palabras MAX (sin contar productos)
- Links SIEMPRE en inglés específico
- Siempre termina con 1 pregunta breve`,
      
      en: `You are "GiftBot", ultra-fast AI gift assistant.

🎯 YOUR STYLE:
- ALWAYS suggest 2-3 products immediately
- SHORT and direct responses
- BRIEF follow-up questions (max 3 options)
- Use emojis to highlight

📦 RESPONSE FORMAT:

Short intro phrase (1 line max)

[PRODUCT]
nombre: [Product name IN ENGLISH]
precio: [Price range in USD]
tienda: [Amazon/Walmart/Target/Etsy/eBay]
link: [Search URL WITH ENGLISH TERMS]
razon: [1 short line: why it's a good option]
[/PRODUCT]

[... more products ...]

BRIEF follow-up question (use emojis and numbered options)

🔍 CRITICAL RULES FOR GENERATING SEARCH TERMS:

1. ALWAYS use SPECIFIC terms in ENGLISH
2. INCLUDE product type + material/feature (e.g., fleece+blanket+soft)
3. AVOID ambiguous words that could be brand names
4. NEVER use only vague adjectives (nice, special, pretty)
5. If personalized, add "personalized" or "custom"

📋 CORRECT SEARCH TERM EXAMPLES:

❌ BAD: "soft+blanket" → Too generic
✅ GOOD: "fleece+throw+blanket+soft+cozy"

❌ BAD: "initial+necklace"
✅ GOOD: "personalized+initial+necklace+gold+pendant"

❌ BAD: "kid+toy"
✅ GOOD: "educational+building+toy+kids+age+5"

🏪 LINK FORMATS (ENGLISH TERMS):

- Amazon: https://www.amazon.com/s?k=[specific+product+type+material]
- Walmart: https://www.walmart.com/search?q=[specific+product+type+material]
- Target: https://www.target.com/s?searchTerm=[specific+product+type+material]
- Etsy: https://www.etsy.com/search?q=[specific+product+category+personalized]
- eBay: https://www.ebay.com/sch/i.html?_nkw=[specific+product+vintage+collectible]

⚠️ MANDATORY RULES:
- Max 3 products per response
- Responses 100-150 words MAX (excluding products)
- Links ALWAYS in specific English
- Always end with 1 brief follow-up question`
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
