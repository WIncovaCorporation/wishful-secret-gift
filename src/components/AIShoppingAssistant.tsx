import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductCard, ProductCardData } from "./ProductCard";

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

// Remove product tags from text for display
const removeProductTags = (text: string): string => {
  return text.replace(/\[PRODUCT\][\s\S]*?\[\/PRODUCT\]/g, "").trim();
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize messages with current language
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: t("aiAssistant.initialMessage"),
    },
  ]);

  // Update initial message when language changes
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: t("aiAssistant.initialMessage"),
      },
    ]);
  }, [language, t]);

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
        const errorText = await response.text();
        let errorMsg = language === 'en' 
          ? "Could not connect to the assistant. Please try again."
          : "No pude conectar con el asistente. Intenta de nuevo.";
        
        // Handle rate limit errors specifically
        if (response.status === 429 || errorText.includes('429')) {
          errorMsg = language === 'en'
            ? "The AI assistant is currently busy. Please wait a moment and try again."
            : "El asistente está ocupado. Por favor espera un momento e intenta de nuevo.";
        }
        
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              // OpenAI format: choices[0].delta.content
              const text = parsed.content;
              
              if (text) {
                assistantMessage += text;
                const products = parseProducts(assistantMessage);
                const cleanContent = removeProductTags(assistantMessage);
                
                setMessages([
                  ...newMessages,
                  { 
                    role: "assistant", 
                    content: cleanContent || assistantMessage,
                    products: products.length > 0 ? products : undefined,
                  },
                ]);
              }
            } catch (e) {
              console.error("Parse error:", e, "Line:", line);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = error instanceof Error ? error.message : (
        language === 'en' 
          ? "Could not connect to the assistant. Please try again."
          : "No pude conectar con el asistente. Intenta de nuevo."
      );
      toast.error(errorMsg);
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-primary to-primary/80 hover:scale-110 transition-all"
          size="icon"
          aria-label={t("aiAssistant.title")}
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">{t("aiAssistant.title")}</h3>
                <p className="text-xs opacity-90">Powered by OpenAI GPT-4</p>
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
                      <div className="space-y-4">
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

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("aiAssistant.placeholder")}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
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
