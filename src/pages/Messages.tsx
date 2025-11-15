import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Gift, Calendar, DollarSign, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import LanguageSelector from "@/components/LanguageSelector";
import { AnonymousChat } from "@/components/AnonymousChat";

interface ReceiverAssignment {
  id: string;
  group_id: string;
  giver_id: string;
  receiver_id: string;
  groups?: {
    name: string;
    min_budget: number | null;
    max_budget: number | null;
    exchange_date: string | null;
  };
  unread_count?: number;
}

const Messages = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ReceiverAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ReceiverAssignment | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get all groups where current user is the RECEIVER
      const { data: exchangesData, error: exchangesError } = await supabase
        .from("gift_exchanges")
        .select(`
          id,
          group_id,
          giver_id,
          receiver_id,
          groups (
            name,
            min_budget,
            max_budget,
            exchange_date
          )
        `)
        .eq("receiver_id", session.user.id);

      if (exchangesError) throw exchangesError;

      // Get unread message count for each assignment
      const assignmentsWithUnread = await Promise.all(
        (exchangesData || []).map(async (assignment) => {
          const { count } = await supabase
            .from("anonymous_messages")
            .select("*", { count: "exact", head: true })
            .eq("group_id", assignment.group_id)
            .eq("giver_id", assignment.giver_id)
            .eq("receiver_id", assignment.receiver_id)
            .eq("is_read", false);

          return {
            ...assignment,
            unread_count: count || 0,
          };
        })
      );

      setAssignments(assignmentsWithUnread);

      // Auto-select first assignment if exists
      if (assignmentsWithUnread.length > 0) {
        setSelectedAssignment(assignmentsWithUnread[0]);
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando mensajes..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="gap-2"
              size="sm"
            >
              <Gift className="h-4 w-4" />
              Inicio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Mensajes Anónimos
            </h1>
            <p className="text-muted-foreground">
              Mensajes de las personas que te van a regalar (identidad oculta)
            </p>
          </div>

          {assignments.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>No tienes mensajes</CardTitle>
                <CardDescription>
                  Cuando alguien te asigne como destinatario en un grupo, verás sus mensajes aquí.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/groups")}>
                  Ir a Grupos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
              {/* Left sidebar - List of groups */}
              <div className="space-y-3">
                <h2 className="font-semibold text-sm text-muted-foreground px-3">
                  Grupos donde eres destinatario
                </h2>
                {assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className={`cursor-pointer transition-colors hover:bg-secondary/50 ${
                      selectedAssignment?.id === assignment.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm">
                            {assignment.groups?.name}
                          </CardTitle>
                        </div>
                        {assignment.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {assignment.unread_count}
                          </Badge>
                        )}
                      </div>
                      {assignment.groups?.exchange_date && (
                        <CardDescription className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.groups.exchange_date).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Right side - Chat area */}
              {selectedAssignment && (
                <div className="space-y-4">
                  {/* Group info card */}
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        {selectedAssignment.groups?.name}
                      </CardTitle>
                      <CardDescription>
                        Tu Amigo Secreto te enviará mensajes anónimos aquí
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      {(selectedAssignment.groups?.min_budget || selectedAssignment.groups?.max_budget) && (
                        <div className="flex items-start gap-2 p-3 bg-secondary/20 rounded-lg">
                          <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Presupuesto</p>
                            <p className="text-sm font-semibold">
                              {selectedAssignment.groups.min_budget && selectedAssignment.groups.max_budget
                                ? `$${selectedAssignment.groups.min_budget} - $${selectedAssignment.groups.max_budget}`
                                : selectedAssignment.groups.min_budget
                                ? `Min $${selectedAssignment.groups.min_budget}`
                                : `Max $${selectedAssignment.groups.max_budget}`}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedAssignment.groups?.exchange_date && (
                        <div className="flex items-start gap-2 p-3 bg-secondary/20 rounded-lg">
                          <Calendar className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Intercambio</p>
                            <p className="text-sm font-semibold">
                              {new Date(selectedAssignment.groups.exchange_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Chat component - RECEIVER can respond here */}
                  <AnonymousChat
                    groupId={selectedAssignment.group_id}
                    receiverId={selectedAssignment.giver_id} // Swap: receiver sends to giver
                    currentUserId={selectedAssignment.receiver_id}
                  />

                  {/* Info card */}
                  <Card className="border-blue-500/50 bg-blue-500/5">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notificaciones por Email
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Recibirás un correo cada vez que tu Amigo Secreto te envíe un mensaje.
                        Tus respuestas también enviarán notificaciones por email.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;