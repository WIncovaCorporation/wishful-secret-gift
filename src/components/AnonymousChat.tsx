import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  message: string;
  created_at: string;
  giver_id: string;
  receiver_id: string;
  is_read: boolean;
}

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  message_count: number;
  reset_at: string;
}

interface AnonymousChatProps {
  groupId: string;
  receiverId: string;
  currentUserId: string;
}

export const AnonymousChat = ({ groupId, receiverId, currentUserId }: AnonymousChatProps) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remainingMessages, setRemainingMessages] = useState<number>(5);
  const [resetTime, setResetTime] = useState<string>("");

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    checkMessageLimit();
  }, [groupId, receiverId]);

  const checkMessageLimit = async () => {
    try {
      const { data, error } = await supabase.rpc('check_anonymous_message_limit', {
        p_user_id: currentUserId
      });

      if (error) {
        console.error("Error checking message limit:", error);
        return;
      }

      if (data) {
        const limitData = data as unknown as RateLimitResponse;
        setRemainingMessages(limitData.remaining || 0);
        if (limitData.reset_at) {
          const resetDate = new Date(limitData.reset_at);
          setResetTime(resetDate.toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
          }));
        }
      }
    } catch (error) {
      console.error("Error checking message limit:", error);
    }
  };

  const loadMessages = async () => {
    try {
      // Load messages in BOTH directions: currentUser ↔ otherUser
      const { data, error } = await supabase
        .from("anonymous_messages")
        .select("*")
        .eq("group_id", groupId)
        .or(`and(giver_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(giver_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("anonymous-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "anonymous_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.giver_id === currentUserId && newMsg.receiver_id === receiverId) ||
            (newMsg.receiver_id === currentUserId && newMsg.giver_id === receiverId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Check rate limit before sending
    const limitCheck = await supabase.rpc('check_anonymous_message_limit', {
      p_user_id: currentUserId
    });

    if (limitCheck.error) {
      toast.error("Error al verificar límite de mensajes");
      return;
    }

    const limitData = limitCheck.data as unknown as RateLimitResponse;
    
    if (!limitData?.allowed) {
      toast.error(`🚫 Has alcanzado el límite diario de 5 mensajes anónimos. Intenta nuevamente mañana.`, {
        duration: 6000
      });
      toast.info(`⏰ El límite se reinicia a las: ${resetTime}`, {
        duration: 6000
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("anonymous_messages")
        .insert({
          group_id: groupId,
          giver_id: currentUserId,
          receiver_id: receiverId,
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Message inserted successfully:", data);

      // Increment message count
      await supabase.rpc('increment_message_count', {
        p_user_id: currentUserId
      });

      // Update remaining messages
      await checkMessageLimit();

      // Call edge function to send notification
      try {
        await supabase.functions.invoke('notify-anonymous-message', {
          body: {
            type: 'INSERT',
            table: 'anonymous_messages',
            record: data,
            schema: 'public'
          }
        });
      } catch (notifError) {
        console.warn("Notification error (non-blocking):", notifError);
      }

      setNewMessage("");
      toast.success(`✅ Mensaje enviado anónimamente (${remainingMessages - 1} mensajes restantes hoy)`);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje. Por favor intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t("chat.title")}
        </CardTitle>
        <CardDescription>{t("chat.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* How it works accordion */}
        <Accordion type="single" collapsible>
          <AccordionItem value="how-it-works" className="border-0">
            <AccordionTrigger className="text-sm py-2 hover:no-underline">
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                {t("chat.howItWorks")}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground pb-4">
              {t("chat.howItWorksDesc")}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Messages list */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Cargando mensajes...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("chat.noMessages")}
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.giver_id === currentUserId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.giver_id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-muted-foreground">
              Mensajes disponibles hoy:
            </span>
            <span className={`font-semibold ${remainingMessages <= 1 ? 'text-destructive' : 'text-primary'}`}>
              {remainingMessages} / 5
            </span>
          </div>
          {remainingMessages <= 2 && resetTime && (
            <p className="text-xs text-muted-foreground px-1">
              ⏰ Se reinicia: {resetTime}
            </p>
          )}
          
          <div className="flex gap-2">
            <Textarea
              placeholder={remainingMessages === 0 ? "Límite diario alcanzado" : t("chat.placeholder")}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="min-h-[60px] resize-none"
              disabled={sending || remainingMessages === 0}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || remainingMessages === 0}
              size="icon"
              className="h-[60px] w-[60px]"
              title={remainingMessages === 0 ? "Límite diario alcanzado" : "Enviar mensaje"}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          💡 {t("chat.howItWorksDesc")}
        </p>
      </CardContent>
    </Card>
  );
};
