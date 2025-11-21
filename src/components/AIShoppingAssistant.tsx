import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductCard, ProductCardData } from "./ProductCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Parse products from AI message
const parseProducts = (text: string): ProductCardData[] => {
  const products: ProductCardData[] = [];
  const productRegex = /\[PRODUCT\]([\s\S]*?)\[\/PRODUCT\]/g;
  let match;

  while ((match = productRegex.exec(text)) !== null) {
    const productText = match[1];
    const nameMatch = productText.match(/name:\s*(.+)/i) || productText.match(/nombre:\s*(.+)/i);
    const priceMatch = productText.match(/price:\s*(.+)/i) || productText.match(/precio:\s*(.+)/i);
    const storeMatch = productText.match(/store:\s*(.+)/i) || productText.match(/tienda:\s*(.+)/i);
    const linkMatch = productText.match(/link:\s*(.+)/i);
    const reasonMatch = productText.match(/reason:\s*(.+)/i) || productText.match(/razon:\s*(.+)/i);
    const imageMatch = productText.match(/image:\s*(.+)/i) || productText.match(/imagen:\s*(.+)/i);
    const ratingMatch = productText.match(/rating:\s*(.+)/i) || productText.match(/calificacion:\s*(.+)/i);
    const reviewCountMatch = productText.match(/reviews?:\s*(\d+)/i);

    if (nameMatch && priceMatch && storeMatch && linkMatch) {
      products.push({
        name: nameMatch[1].trim(),
        price: priceMatch[1].trim(),
        store: storeMatch[1].trim(),
        link: linkMatch[1].trim(),
        reason: reasonMatch ? reasonMatch[1].trim() : "",
        image: imageMatch ? imageMatch[1].trim() : undefined,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
        reviewCount: reviewCountMatch ? parseInt(reviewCountMatch[1]) : undefined,
      });
    }
  }

  return products;
};

// Remove product tags AND long explanatory text after products
const cleanAssistantMessage = (text: string): string => {
  // Remove product blocks
  let cleaned = text.replace(/\[PRODUCT\][\s\S]*?\[\/PRODUCT\]/g, '').trim();
  
  // If message has products, keep only intro (before first product) and outro (after last product)
  const lines = cleaned.split('\n').filter(line => line.trim());
  
  // Keep max 5 lines of text to avoid walls of text
  if (lines.length > 5) {
    return lines.slice(0, 2).join('\n') + '\n\n' + lines.slice(-3).join('\n');
  }
  
  return cleaned;
};

// Function to render text with links as plain text (not clickable)
const renderMessageWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s\)]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <span
          key={index}
          className="text-muted-foreground font-mono text-xs break-all italic"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

type Message = {
  role: "user" | "assistant";
  content: string;
  products?: ProductCardData[];
};

export const AIShoppingAssistant = () => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize messages with current language
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: language === 'es' 
        ? "¡Hola! Soy tu asistente de regalos 🎁\n\nCuéntame: ¿para quién buscas regalo?\n\nPuedes decir algo como:\n• \"Regalo para mi mamá\"\n• \"Cumpleaños de mi hermana, le gusta yoga, $30\"\n• \"Aniversario para mi esposo\""
        : "Hi! I'm your gift assistant 🎁\n\nTell me: who are you looking for a gift for?\n\nYou can say something like:\n• \"Gift for my mom\"\n• \"Sister's birthday, she likes yoga, $30\"\n• \"Anniversary for my husband\"",
    },
  ]);

  // Load AI usage tracking when opening chat
  useEffect(() => {
    if (isOpen) {
      loadAIUsage();
    }
  }, [isOpen]);

  const loadAIUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin
      const { data: userRoles } = await supabase.rpc('get_user_roles', {
        _user_id: user.id
      });
      
      const isAdmin = userRoles?.some((r: any) => r.role === 'admin') || false;

      // Admins have unlimited usage
      if (isAdmin) {
        setRemaining(999);
        setIsLimitReached(false);
        console.log('✨ ADMIN MODE: Unlimited AI searches');
        return;
      }

      // Regular users: check usage
      const { data: usage } = await supabase
        .from('ai_usage_tracking')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('feature_type', 'shopping_assistant')
        .maybeSingle();

      const usageCount = usage?.usage_count || 0;
      const remainingCount = Math.max(0, 10 - usageCount);
      setRemaining(remainingCount);
      setIsLimitReached(remainingCount === 0);
    } catch (error) {
      console.error('Error loading AI usage:', error);
    }
  };

  // Listen for external open requests
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openAIChat', handleOpenChat);
    return () => window.removeEventListener('openAIChat', handleOpenChat);
  }, []);

  // Update initial message when language changes
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: language === 'es' 
          ? "¡Hola! Soy tu asistente de regalos 🎁\n\nCuéntame: ¿para quién buscas regalo?\n\nPuedes decir algo como:\n• \"Regalo para mi mamá\"\n• \"Cumpleaños de mi hermana, le gusta yoga, $30\"\n• \"Aniversario para mi esposo\""
          : "Hi! I'm your gift assistant 🎁\n\nTell me: who are you looking for a gift for?\n\nYou can say something like:\n• \"Gift for my mom\"\n• \"Sister's birthday, she likes yoga, $30\"\n• \"Anniversary for my husband\"",
      },
    ]);
  }, [language]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const browserLang = navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-shopping-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            userId: user?.id,
            language: browserLang,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        
        // Handle 429 rate limit error
        if (response.status === 429) {
          if (errorData.code === 'RATE_LIMIT') {
            // Gemini API rate limit - temporary
            toast.error(errorData.error || '⏰ Cuota de Gemini agotada', {
              description: errorData.details || 'Espera 1 minuto y reintenta',
              duration: 8000
            });
          } else {
            // User daily limit
            setIsLimitReached(true);
            setRemaining(0);
            toast.error(errorData.error || "Límite diario alcanzado", {
              description: errorData.reset_at 
                ? `Se restablecerá: ${errorData.reset_at}`
                : "Vuelve mañana o actualiza tu plan",
              duration: 5000
            });
          }
          throw new Error(errorData.error || "Rate limit exceeded");
        }
        
        // Handle 403 invalid API key
        if (response.status === 403) {
          toast.error('Error de configuración', {
            description: errorData.error || 'Contacta al administrador',
            duration: 6000
          });
          throw new Error(errorData.error || "Invalid API key");
        }
        
        let errorMsg = language === 'en' 
          ? "Could not connect to the assistant. Please try again."
          : "No pude conectar con el asistente. Intenta de nuevo.";
        
        throw new Error(errorMsg);
      }

      const data = await response.json().catch(() => null);

      if (!data || !data.message) {
        console.error('⚠️ No se recibió texto del asistente o formato inesperado', data);
        toast.error('No se recibió respuesta del asistente', {
          description: 'Por favor intenta de nuevo',
        });
        setMessages(newMessages);
        return;
      }

      const fullText = data.message as string;
      const products = parseProducts(fullText);
      const cleanContent = cleanAssistantMessage(fullText);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: cleanContent || fullText,
          products: products.length > 0 ? products : undefined,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error
        ? error.message
        : language === 'en'
          ? 'Could not connect to the assistant. Please try again.'
          : 'No pude conectar con el asistente. Intenta de nuevo.';
      toast.error(errorMsg);
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
      // Reload usage after successful chat
      loadAIUsage();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading || isLimitReached) return;
    
    // Prevenir múltiples clicks
    if (isLoading) {
      toast.info('⏳ Procesando solicitud anterior...');
      return;
    }
    
    streamChat(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-12 w-12 sm:h-14 sm:w-14 sm:bottom-6 sm:right-6 rounded-full shadow-lg z-50 bg-gradient-to-r from-primary to-primary/80 hover:scale-110 transition-all"
          size="icon"
          aria-label={t("aiAssistant.title")}
        >
          <Bot className="h-6 w-6 sm:h-7 sm:w-7" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-full max-w-[420px] h-[90vh] max-h-[700px] shadow-2xl z-50 flex flex-col sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[650px] md:w-[420px] mx-4 sm:mx-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">{t("aiAssistant.title")}</h3>
              <p className="text-xs opacity-90">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1 max-w-[85%] space-y-3">
                    {msg.content && (
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {renderMessageWithLinks(msg.content)}
                        </p>
                      </div>
                    )}
                    
                    {msg.products && msg.products.length > 0 && (
                      <div className="space-y-2">
                        {msg.products.map((product, pidx) => (
                          <ProductCard key={pidx} product={product} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 space-y-2">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {language === 'es' ? 'O prueba estos ejemplos:' : 'Or try these examples:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                  onClick={() => setInput(language === 'es' ? 'Regalo para mi mamá que le gusta cocinar' : 'Gift for my mom who likes cooking')}
                >
                  👩 {language === 'es' ? 'Mamá cocinera' : 'Mom who cooks'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                  onClick={() => setInput(language === 'es' ? 'Cumpleaños hermana 25 años moderna $40' : 'Sister 25th birthday modern $40')}
                >
                  🎂 {language === 'es' ? 'Hermana trendy' : 'Trendy sister'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                  onClick={() => setInput(language === 'es' ? 'Regalo romántico para esposo aniversario' : 'Romantic gift for husband anniversary')}
                >
                  💑 {language === 'es' ? 'Aniversario' : 'Anniversary'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                  onClick={() => setInput(language === 'es' ? 'Juguete niño 8 años le gusta Lego' : 'Toy for 8 year old boy likes Lego')}
                >
                  🧒 {language === 'es' ? 'Niño 8 años' : '8 year old boy'}
                </Button>
              </div>
            </div>
          )}

          {messages.length > 1 && !isLoading && (
            <div className="px-3 pb-3 flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput(language === 'es' ? 'Muéstrame más opciones similares' : 'Show me more similar options')}
                className="text-xs px-2 py-1 h-7"
              >
                🎯 {language === 'es' ? 'Más como estos' : 'More like these'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput(language === 'es' ? 'Opciones más económicas' : 'More affordable options')}
                className="text-xs px-2 py-1 h-7"
              >
                💰 {language === 'es' ? 'Más baratos' : 'Cheaper'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput(language === 'es' ? 'Algo más especial/premium' : 'Something more special/premium')}
                className="text-xs px-2 py-1 h-7"
              >
                ✨ {language === 'es' ? 'Más especial' : 'More special'}
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t space-y-3">
            {/* AI Usage Counter */}
            {remaining !== null && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Búsquedas de IA hoy:</span>
                </div>
                {remaining === 999 ? (
                  <span className="font-bold text-primary flex items-center gap-1">
                    ✨ Admin: Ilimitado
                  </span>
                ) : (
                  <span className={`font-semibold ${remaining === 0 ? 'text-destructive' : 'text-primary'}`}>
                    {remaining}/10
                  </span>
                )}
              </div>
            )}

            {/* Rate Limit Alert */}
            {isLimitReached && (
              <Alert variant="destructive" className="py-2">
                <AlertTitle className="text-sm font-semibold mb-1">Límite diario alcanzado</AlertTitle>
                <AlertDescription className="text-xs">
                  Has usado tus 10 búsquedas de hoy. Se restablecerá mañana a las 12:00 AM.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLimitReached ? "Límite alcanzado" : t("aiAssistant.placeholder")}
                disabled={isLoading || isLimitReached}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isLimitReached}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
