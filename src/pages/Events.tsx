import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import type { User } from "@supabase/supabase-js";

interface Event {
  id: string;
  name: string;
  type: string;
  date: string | null;
  created_at: string;
}

const eventTypeLabels: Record<string, string> = {
  christmas: "🎄 Navidad",
  birthday: "🎂 Cumpleaños",
  valentine: "💘 San Valentín",
  custom: "🎉 Personalizado",
};

const Events = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    type: "christmas",
    date: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await loadEvents(session.user.id);
    setLoading(false);
  };

  const loadEvents = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("events")
        .select("*")
        .eq("created_by", userId)
        .order("date", { ascending: true, nullsFirst: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from("events")
        .insert([{
          name: newEvent.name,
          type: newEvent.type,
          date: newEvent.date || null,
          created_by: user.id,
        }]);

      if (error) throw error;

      toast.success("¡Evento creado!");
      setDialogOpen(false);
      setNewEvent({
        name: "",
        type: "christmas",
        date: "",
      });
      await loadEvents(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast.success("Evento eliminado!");
      await loadEvents(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              ← Volver
            </Button>
            <h1 className="text-2xl font-bold">Mis Eventos</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">Gestiona tus eventos especiales</p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
                <DialogDescription>Define una ocasión especial</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <Label htmlFor="event-name">Nombre del Evento *</Label>
                  <Input
                    id="event-name"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    placeholder="Ej: Navidad en Familia 2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event-type">Tipo de Evento *</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="christmas">🎄 Navidad</SelectItem>
                      <SelectItem value="birthday">🎂 Cumpleaños</SelectItem>
                      <SelectItem value="valentine">💘 San Valentín</SelectItem>
                      <SelectItem value="custom">🎉 Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="event-date">Fecha</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Crear Evento</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No tienes eventos aún</h3>
              <p className="text-muted-foreground mb-4">Crea tu primer evento especial</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="shadow-medium hover:shadow-large transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">
                          {event.type === "christmas" ? "🎄" :
                           event.type === "birthday" ? "🎂" :
                           event.type === "valentine" ? "💘" : "🎉"}
                        </span>
                        {event.name}
                      </CardTitle>
                      <CardDescription>
                        {eventTypeLabels[event.type]}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {event.date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;