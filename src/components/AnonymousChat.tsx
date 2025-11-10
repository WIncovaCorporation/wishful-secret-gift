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

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [groupId, receiverId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("anonymous_messages")
        .select("*")
        .eq("group_id", groupId)
        .eq("giver_id", currentUserId)
        .eq("receiver_id", receiverId)
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

    setSending(true);
    try {
      const { error } = await supabase
        .from("anonymous_messages")
        .insert({
          group_id: groupId,
          giver_id: currentUserId,
          receiver_id: receiverId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
      toast.success("Mensaje enviado anónimamente");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje: " + error.message);
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
        <div className="flex gap-2">
          <Textarea
            placeholder={t("chat.placeholder")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground italic">
          💡 {t("chat.howItWorksDesc")}
        </p>
      </CardContent>
    </Card>
  );
};
