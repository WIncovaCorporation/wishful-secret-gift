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
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Footer from "@/components/Footer";
import { HelpTooltip } from "@/components/HelpTooltip";
import { EmptyStateCard } from "@/components/EmptyStateCard";
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ 
    open: false, 
    id: "" 
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
      const { data, error } = await supabase
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
      const { error } = await supabase
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
    setDeleteConfirm({ open: true, id: eventId });
  };

  const confirmDeleteEvent = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", deleteConfirm.id);

      if (error) throw error;

      toast.success("Evento eliminado!");
      await loadEvents(user.id);
      setDeleteConfirm({ open: false, id: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <LoadingSpinner message="Cargando tus eventos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Inicio
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Mis Eventos
              <HelpTooltip content="Crea eventos especiales (Navidad, cumpleaños, bodas) para organizar todas tus listas y grupos relacionados en un solo lugar." />
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground text-base">
              🎉 Organiza ocasiones especiales y asocia listas/grupos
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Navidad, cumpleaños, bodas... todo en un solo lugar
            </p>
          </div>
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
          <EmptyStateCard
            icon={Calendar}
            title="¡Organiza tu primer evento!"
            description="Los eventos te ayudan a mantener todo organizado. Crea un evento como 'Navidad 2025' y luego asocia listas de regalos y grupos de intercambio a ese evento. Perfecto para ver todo relacionado a una ocasión especial en un solo vistazo."
            actionLabel="Crear Mi Primer Evento"
            onAction={() => setDialogOpen(true)}
          />
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

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="¿Eliminar evento?"
        description="Esta acción no se puede deshacer. El evento será eliminado permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteEvent}
        variant="destructive"
      />

      <Footer />
    </div>
  );
};

export default Events;