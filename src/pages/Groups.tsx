import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Copy, Check, Trash2, Sparkles, Gift, Lock, Shield, Scale, AlertCircle, Calendar, DollarSign, Share2, Mail, MessageSquare, ArrowLeft, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpTooltip } from "@/components/HelpTooltip";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { GroupMembersList } from "@/components/GroupMembersList";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { ContextualTooltip } from "@/components/ContextualTooltip";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { useTooltips } from "@/hooks/useTooltips";
import type { User } from "@supabase/supabase-js";

interface Group {
  id: string;
  name: string;
  description: string | null;
  share_code: string;
  min_budget: number | null;
  max_budget: number | null;
  exchange_date: string | null;
  is_drawn: boolean;
  created_by: string;
  notification_mode: string;
  organizer_message?: string | null;
  suggested_budget?: number | null;
  members?: GroupMember[];
  exchanges?: Array<{
    giver_id: string;
    receiver_id: string;
    viewed_at: string | null;
  }>;
}

interface GroupMember {
  id: string;
  user_id: string;
  profiles?: {
    display_name: string;
  };
}

const Groups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isFree } = useUserRole();
  const { features, getLimit } = useSubscription();
  const { shouldShowTooltip, markTooltipAsSeen } = useTooltips();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    min_budget: "",
    max_budget: "",
    exchange_date: "",
    notification_mode: "group",
    organizer_message: "",
    suggested_budget: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ 
    open: false, 
    id: "" 
  });
  const [drawConfirm, setDrawConfirm] = useState<{ open: boolean; groupId: string; group: Group | null }>({
    open: false,
    groupId: "",
    group: null
  });

  useEffect(() => {
    checkAuth();
  }, []);

  // Mostrar tooltip solo la primera vez que se abre el diálogo
  useEffect(() => {
    if (dialogOpen && shouldShowTooltip('create_exchange')) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, shouldShowTooltip]);

  // Detectar si se viene desde el onboarding con datos de plantilla
  useEffect(() => {
    const state = location.state as any;
    if (state?.templateData && state?.openDialog) {
      // Pre-llenar el formulario con datos de la plantilla
      setNewGroup({
        name: state.templateData.name,
        description: state.templateData.description,
        min_budget: state.templateData.min_budget,
        max_budget: state.templateData.max_budget,
        exchange_date: state.templateData.exchange_date,
        notification_mode: state.templateData.notification_mode,
        organizer_message: "",
        suggested_budget: state.templateData.suggested_budget,
      });
      
      // Abrir el diálogo de crear grupo
      setDialogOpen(true);
      
      // Cerrar el modal de selección de plantillas si estaba abierto
      setShowTemplateSelection(false);
      
      // Limpiar el state para que no se ejecute múltiples veces
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await loadGroups(session.user.id);
    setLoading(false);
  };

  const loadGroups = async (userId: string) => {
    try {
      // Get groups where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

      if (memberError) throw memberError;

      const groupIds = memberData?.map((m: any) => m.group_id) || [];

      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select(`
          *,
          exchanges:gift_exchanges(giver_id, receiver_id, viewed_at)
        `)
        .in("id", groupIds)
        .order("created_at", { ascending: false });

      if (groupsError) throw groupsError;

      if (groupsData) {
        const groupsWithMembers = await Promise.all(
          groupsData.map(async (group: any) => {
            // Get group members with their profile information
            const { data: members, error: membersError } = await supabase
              .from("group_members")
              .select(`
                id,
                user_id,
                profiles!group_members_user_id_fkey (
                  display_name
                )
              `)
              .eq("group_id", group.id);

            if (membersError) {
              console.error("Error loading members for group:", group.id, membersError);
            }

            console.log(`Miembros del grupo ${group.name}:`, members);

            return { ...group, members: members || [] };
          })
        );

        setGroups(groupsWithMembers);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Input validation
    if (!newGroup.name.trim()) {
      toast.error("El nombre del grupo es requerido");
      return;
    }

    // Date validation
    if (newGroup.exchange_date) {
      const exchangeDate = new Date(newGroup.exchange_date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (exchangeDate < tomorrow) {
        toast.error("La fecha de intercambio debe ser al menos 1 día en el futuro");
        return;
      }
    }

    // Budget validation
    const minBudget = newGroup.min_budget ? parseFloat(newGroup.min_budget) : null;
    const maxBudget = newGroup.max_budget ? parseFloat(newGroup.max_budget) : null;
    const suggestedBudget = newGroup.suggested_budget ? parseFloat(newGroup.suggested_budget) : null;

    if (minBudget !== null) {
      if (minBudget < 5) {
        toast.error("El presupuesto mínimo debe ser al menos $5");
        return;
      }
      if (minBudget > 10000) {
        toast.error("El presupuesto mínimo no puede exceder $10,000");
        return;
      }
    }

    if (maxBudget !== null) {
      if (maxBudget < 5) {
        toast.error("El presupuesto máximo debe ser al menos $5");
        return;
      }
      if (maxBudget > 10000) {
        toast.error("El presupuesto máximo no puede exceder $10,000");
        return;
      }
    }

    if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
      toast.error("El presupuesto mínimo no puede ser mayor que el máximo");
      return;
    }

    if (suggestedBudget !== null) {
      if (suggestedBudget < 5) {
        toast.error("El presupuesto sugerido debe ser al menos $5");
        return;
      }
      if (suggestedBudget > 10000) {
        toast.error("El presupuesto sugerido no puede exceder $10,000");
        return;
      }
      if (minBudget !== null && suggestedBudget < minBudget) {
        toast.error("El presupuesto sugerido debe ser mayor o igual al mínimo");
        return;
      }
      if (maxBudget !== null && suggestedBudget > maxBudget) {
        toast.error("El presupuesto sugerido debe ser menor o igual al máximo");
        return;
      }
    }

    // Check limits for free users
    const groupLimit = getLimit('groups');
    if (isFree() && groups.length >= groupLimit) {
      setShowUpgradePrompt(true);
      setDialogOpen(false);
      toast.error(`Plan Free: máximo ${groupLimit} grupos. Actualiza para crear más.`);
      return;
    }

    try {
      // Generate a unique share code (lowercase for consistency)
      const shareCode = Math.random().toString(36).substring(2, 10).toLowerCase();
      
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert([{
          name: newGroup.name,
          description: newGroup.description || null,
          min_budget: newGroup.min_budget ? parseFloat(newGroup.min_budget) : null,
          max_budget: newGroup.max_budget ? parseFloat(newGroup.max_budget) : null,
          exchange_date: newGroup.exchange_date || null,
          created_by: user.id,
          share_code: shareCode,
          notification_mode: newGroup.notification_mode,
          organizer_message: newGroup.organizer_message || null,
          suggested_budget: newGroup.suggested_budget ? parseFloat(newGroup.suggested_budget) : null,
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert([{ group_id: groupData?.id, user_id: user.id }]);

      if (memberError) throw memberError;

      toast.success("¡Grupo creado exitosamente!");
      
      // Mostrar confetti solo si es el primer grupo
      const isFirstGroup = groups.length === 0;
      if (isFirstGroup) {
        setShowConfetti(true);
      }
      
      setDialogOpen(false);
      setNewGroup({
        name: "",
        description: "",
        min_budget: "",
        max_budget: "",
        exchange_date: "",
        notification_mode: "group",
        organizer_message: "",
        suggested_budget: "",
      });
      await loadGroups(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Trim and normalize the code - remove all whitespace and convert to lowercase
      const normalizedCode = joinCode.trim().replace(/\s+/g, '').toLowerCase();
      
      if (!normalizedCode) {
        toast.error("Por favor ingresa un código válido");
        return;
      }

      console.log("Buscando grupo con código:", normalizedCode);

      // First, search for the group using a more permissive query
      // We need to check all groups that match the code, regardless of membership
      const { data: allGroups, error: searchError } = await supabase
        .from("groups")
        .select("id, name, created_by")
        .eq("share_code", normalizedCode);

      console.log("Resultado de búsqueda:", { allGroups, searchError });

      if (searchError) {
        console.error("Error al buscar grupo:", searchError);
        toast.error("Error al buscar el grupo");
        return;
      }

      if (!allGroups || allGroups.length === 0) {
        console.log("No se encontró grupo con código:", normalizedCode);
        toast.error("Código de grupo inválido");
        return;
      }

      const groupData = allGroups[0];

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupData.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        toast.error("Ya eres miembro de este grupo");
        setJoinDialogOpen(false);
        setJoinCode("");
        return;
      }

      const { error: memberError } = await supabase
        .from("group_members")
        .insert([{ group_id: groupData.id, user_id: user.id }]);

      if (memberError) {
        console.error("Error al unirse al grupo:", memberError);
        toast.error("Error al unirse al grupo");
        return;
      }

      toast.success(`¡Te has unido al grupo "${groupData.name}"!`);
      setJoinDialogOpen(false);
      setJoinCode("");
      await loadGroups(user.id);
    } catch (error: any) {
      console.error("Error inesperado:", error);
      toast.error("Error inesperado al unirse al grupo");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareWhatsApp = (group: Group) => {
    const message = `🎁 ¡Te invito a participar en el intercambio de regalos "${group.name}"!\n\n` +
      `Código de acceso: ${group.share_code}\n\n` +
      `Únete aquí: ${window.location.origin}/groups`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = (group: Group) => {
    const subject = `Invitación: ${group.name} - Intercambio de Regalos`;
    const body = `🎁 ¡Hola!\n\n` +
      `Te invito a participar en el intercambio de regalos "${group.name}".\n\n` +
      `Para unirte, sigue estos pasos:\n` +
      `1. Visita: ${window.location.origin}/groups\n` +
      `2. Haz clic en "Unirse con Código"\n` +
      `3. Ingresa este código: ${group.share_code}\n\n` +
      `¡Nos vemos en el intercambio!`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleShareSMS = (group: Group) => {
    const message = `🎁 ¡Únete a "${group.name}"!\n` +
      `Código: ${group.share_code}\n` +
      `Enlace: ${window.location.origin}/groups`;
    
    // iOS usa 'sms:&body=', Android usa 'sms:?body='
    const smsUrl = `sms:${navigator.userAgent.match(/iPhone|iPad|iPod/) ? '&' : '?'}body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const showDrawConfirmation = (group: Group) => {
    const memberCount = group.members?.length || 0;
    
    if (memberCount < 3) {
      toast.error('Se necesitan al menos 3 participantes para realizar el sorteo');
      return;
    }
    
    setDrawConfirm({ open: true, groupId: group.id, group });
  };

  const handleDrawExchange = async () => {
    const groupId = drawConfirm.groupId;
    if (!user || !groupId) return;

    try {
      setDrawConfirm({ open: false, groupId: "", group: null });

      // Get all group members
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      if (!members || members.length < 3) {
        toast.error(t("groups.confirmDraw.minMembers"));
        return;
      }

      // Fisher-Yates shuffle algorithm (improved)
      const shuffleArray = (array: any[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Try up to 10 times to find a valid assignment (no self-gifting)
      let exchanges: any[] = [];
      let attempts = 0;
      let valid = false;

      while (!valid && attempts < 10) {
        const shuffled = shuffleArray(members);
        exchanges = shuffled.map((giver: any, index: number) => ({
          group_id: groupId,
          giver_id: giver.user_id,
          receiver_id: shuffled[(index + 1) % shuffled.length].user_id,
        }));

        // Validate no one gifts themselves
        valid = exchanges.every((ex) => ex.giver_id !== ex.receiver_id);
        attempts++;
      }

      if (!valid) {
        toast.error("No se pudo generar un sorteo válido. Intenta de nuevo.");
        return;
      }

      // Delete previous exchanges if any
      await supabase
        .from("gift_exchanges")
        .delete()
        .eq("group_id", groupId);

      // Insert new exchanges
      const { error: exchangeError } = await supabase
        .from("gift_exchanges")
        .insert(exchanges);

      if (exchangeError) throw exchangeError;

      // Mark group as drawn
      const { error: updateError } = await supabase
        .from("groups")
        .update({ is_drawn: true })
        .eq("id", groupId);

      if (updateError) throw updateError;

      toast.success(t("groups.drawComplete"));
      await loadGroups(user.id);
    } catch (error: any) {
      console.error("Error in draw exchange:", error);
      toast.error(error.message);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setDeleteConfirm({ open: true, id: groupId });
  };

  const confirmDeleteGroup = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", deleteConfirm.id)
        .eq("created_by", user.id);

      if (error) throw error;

      toast.success("Grupo eliminado!");
      await loadGroups(user.id);
      setDeleteConfirm({ open: false, id: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <LoadingSpinner message="Cargando tus grupos..." />
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
              <Users className="h-4 w-4" />
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
              Mis Grupos de Intercambio
              <HelpTooltip content="Crea grupos para organizar intercambios de regalos tipo 'amigo secreto'. Invita participantes, establece presupuesto y fecha, luego realiza el sorteo automático." />
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showUpgradePrompt && (
          <div className="mb-6">
            <UpgradePrompt
              title="¡Alcanzaste el límite de grupos!"
              description={`Tu plan Free permite hasta ${getLimit('groups')} grupos. Actualiza a Premium para grupos ilimitados.`}
              feature="unlimited_groups"
              onDismiss={() => setShowUpgradePrompt(false)}
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <p className="text-muted-foreground text-base">
              👥 Organiza intercambios de regalos tipo "amigo secreto"
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Crea grupos, invita amigos, define presupuesto y fecha, ¡luego sortea!
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Unirse con Código
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unirse a un Grupo</DialogTitle>
                  <DialogDescription>Ingresa el código del grupo</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinGroup} className="space-y-4">
                  <div>
                    <Label htmlFor="join-code">Código del Grupo</Label>
                    <Input
                      id="join-code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Ej: abc123xy"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Unirse al Grupo</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                      <DialogDescription>Configura tu grupo de intercambio</DialogDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDialogOpen(false);
                        setShowTemplateSelection(true);
                      }}
                      className="gap-2 text-muted-foreground hover:text-foreground -mr-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Cambiar plantilla
                    </Button>
                  </div>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="group-name">Nombre del Grupo *</Label>
                    <Input
                      id="group-name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Ej: Oficina 2024, Familia Navidad"
                      required
                    />
                    
                    {/* Tooltip contextual */}
                    <ContextualTooltip
                      show={showTooltip}
                      onClose={() => {
                        setShowTooltip(false);
                        markTooltipAsSeen('create_exchange');
                      }}
                      position="bottom"
                      content={
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">Dale un nombre que identifique la ocasión</p>
                              <p className="text-xs text-gray-300 mt-1">
                                Ejemplo: "Navidad Familia 2024" o "Cumple de Ana"
                              </p>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-desc">Descripción</Label>
                    <Textarea
                      id="group-desc"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Detalles del intercambio..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-budget">Presupuesto Mínimo</Label>
                      <Input
                        id="min-budget"
                        type="number"
                        step="0.01"
                        value={newGroup.min_budget}
                        onChange={(e) => setNewGroup({ ...newGroup, min_budget: e.target.value })}
                        placeholder="$0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-budget">Presupuesto Máximo</Label>
                      <Input
                        id="max-budget"
                        type="number"
                        step="0.01"
                        value={newGroup.max_budget}
                        onChange={(e) => setNewGroup({ ...newGroup, max_budget: e.target.value })}
                        placeholder="$100.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="exchange-date">Fecha del Intercambio</Label>
                    <Input
                      id="exchange-date"
                      type="date"
                      value={newGroup.exchange_date}
                      onChange={(e) => setNewGroup({ ...newGroup, exchange_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="suggested-budget">Presupuesto Sugerido</Label>
                    <Input
                      id="suggested-budget"
                      type="number"
                      step="0.01"
                      value={newGroup.suggested_budget}
                      onChange={(e) => setNewGroup({ ...newGroup, suggested_budget: e.target.value })}
                      placeholder="Ej: 500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="organizer-message">Mensaje del Organizador</Label>
                    <Textarea
                      id="organizer-message"
                      value={newGroup.organizer_message}
                      onChange={(e) => setNewGroup({ ...newGroup, organizer_message: e.target.value })}
                      placeholder="Instrucciones, reglas o información adicional para los participantes..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notification-mode">Modo de Notificaciones 🔔</Label>
                    <select
                      id="notification-mode"
                      value={newGroup.notification_mode}
                      onChange={(e) => setNewGroup({ ...newGroup, notification_mode: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="group">🎉 Notificar a todo el grupo (más emoción)</option>
                      <option value="private">🔒 Solo notificar al receptor (privado)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {newGroup.notification_mode === 'group' 
                        ? '✨ Todos recibirán un email cuando haya mensajes anónimos. ¡Más diversión!'
                        : '🔐 Solo el receptor recibirá notificación. Máxima privacidad.'}
                    </p>
                  </div>
                  <Button type="submit" className="w-full">Crear Grupo</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {groups.length === 0 ? (
          <EmptyStateCard
            icon={Users}
            title="¡Tu primer intercambio de regalos!"
            description="Los grupos son perfectos para organizar 'amigos secretos' o intercambios familiares. Crea un grupo para ser el organizador, o únete con un código si te invitaron. Una vez todos se unan, podrás realizar el sorteo automático y cada persona sabrá a quién regalarle."
            actionLabel="Crear Mi Primer Grupo"
            onAction={() => setDialogOpen(true)}
            secondaryActionLabel="Tengo un Código"
            onSecondaryAction={() => setJoinDialogOpen(true)}
          />
        ) : (
          <div className="grid gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="shadow-medium">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {group.name}
                        {group.is_drawn && (
                          <span className="text-sm px-2 py-1 bg-gradient-warm text-primary-foreground rounded-full">
                            Sorteado
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {group.description || "Sin descripción"}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {group.min_budget && group.max_budget && (
                          <span className="px-2 py-1 bg-muted rounded">
                            Presupuesto: ${group.min_budget} - ${group.max_budget}
                          </span>
                        )}
                        {group.exchange_date && (
                          <span className="px-2 py-1 bg-muted rounded">
                            Fecha: {new Date(group.exchange_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-muted rounded flex items-center gap-1">
                          {group.notification_mode === 'group' ? '🎉 Notificaciones grupales' : '🔒 Notificaciones privadas'}
                        </span>
                      </div>
                    </div>
                     <div className="flex gap-2 flex-wrap">
                      {group.is_drawn ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/groups/${group.id}/assignment`)}
                            className="gap-2"
                          >
                            <Gift className="w-4 h-4" />
                            {t("groups.viewAssignment")}
                          </Button>
                          {group.created_by === user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/groups/${group.id}/admin`)}
                              className="gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Admin: Ver Todas
                            </Button>
                          )}
                        </>
                      ) : (
                        group.created_by === user?.id && (
                          <Button
                            size="sm"
                            onClick={() => showDrawConfirmation(group)}
                            className="gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Sortear
                          </Button>
                        )
                      )}
                      {group.created_by === user?.id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* How It Works Section - Only show if draw hasn't been done */}
                    {!group.is_drawn && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            {t("groups.howItWorks")}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {t("groups.howItWorksDesc")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex gap-3">
                            <div className="text-2xl">🎲</div>
                            <div>
                              <p className="font-semibold">{t("groups.algorithm.title")}</p>
                              <p className="text-xs text-muted-foreground">{t("groups.algorithm.desc")}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="text-2xl">🔒</div>
                            <div>
                              <p className="font-semibold">{t("groups.privacy.title")}</p>
                              <p className="text-xs text-muted-foreground">{t("groups.privacy.desc")}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="text-2xl">⚖️</div>
                            <div>
                              <p className="font-semibold">{t("groups.fairness.title")}</p>
                              <p className="text-xs text-muted-foreground">{t("groups.fairness.desc")}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="text-2xl">🛡️</div>
                            <div>
                              <p className="font-semibold">{t("groups.security.title")}</p>
                              <p className="text-xs text-muted-foreground">{t("groups.security.desc")}</p>
                            </div>
                          </div>

                          <Accordion type="single" collapsible className="mt-4">
                            <AccordionItem value="faq" className="border-0">
                              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                {t("groups.confidence.title")}
                              </AccordionTrigger>
                              <AccordionContent className="space-y-2 text-xs">
                                <div>
                                  <p className="font-semibold">{t("groups.confidence.privacy")}</p>
                                  <p className="text-muted-foreground">{t("groups.confidence.privacyAnswer")}</p>
                                </div>
                                <div>
                                  <p className="font-semibold">{t("groups.confidence.redraw")}</p>
                                  <p className="text-muted-foreground">{t("groups.confidence.redrawAnswer")}</p>
                                </div>
                                <div>
                                  <p className="font-semibold">{t("groups.confidence.memberLeaves")}</p>
                                  <p className="text-muted-foreground">{t("groups.confidence.memberLeavesAnswer")}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                    )}

                    {group.suggested_budget && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>Presupuesto sugerido: ${group.suggested_budget}</span>
                      </div>
                    )}
                    
                    {group.organizer_message && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-1 text-sm">Mensaje del Organizador:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {group.organizer_message}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold mb-2">Código de Invitación</h4>
                      <div className="flex gap-2 flex-wrap">
                        <div className="flex gap-2 flex-1 min-w-[200px]">
                          <Input value={group.share_code} readOnly className="font-mono" />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopyCode(group.share_code)}
                            title="Copiar código"
                          >
                            {copiedCode === group.share_code ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareWhatsApp(group)}
                            className="gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareEmail(group)}
                            className="gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareSMS(group)}
                            className="gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            SMS
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">
                          Miembros
                        </h4>
                        {(group.members?.length || 0) < 3 && !group.is_drawn && (
                          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 text-xs">
                            Mínimo 3 requeridos
                          </Badge>
                        )}
                      </div>
                      <GroupMembersList 
                        members={group.members || []}
                        exchanges={group.exchanges}
                        isDrawn={group.is_drawn}
                        maxVisible={5}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="¿Eliminar grupo?"
        description="Esta acción no se puede deshacer. Se eliminará el grupo y todas sus asignaciones."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteGroup}
        variant="destructive"
      />

      {/* Draw Confirmation Dialog */}
      <Dialog open={drawConfirm.open} onOpenChange={(open) => setDrawConfirm({ ...drawConfirm, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("groups.confirmDraw.title")}
            </DialogTitle>
            <DialogDescription>
              {t("groups.confirmDraw.description")}
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="border-yellow-500/50 bg-yellow-500/5">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
              {t("groups.confirmDraw.warning")}
            </AlertDescription>
          </Alert>

          {drawConfirm.group && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{t("groups.confirmDraw.membersCount")}:</span>
                <span>{drawConfirm.group.members?.length || 0}</span>
              </div>

              {(drawConfirm.group.min_budget || drawConfirm.group.max_budget) && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{t("groups.confirmDraw.budget")}:</span>
                  <span>
                    {drawConfirm.group.min_budget && drawConfirm.group.max_budget
                      ? `$${drawConfirm.group.min_budget} - $${drawConfirm.group.max_budget}`
                      : drawConfirm.group.min_budget
                      ? `Min $${drawConfirm.group.min_budget}`
                      : `Max $${drawConfirm.group.max_budget}`}
                  </span>
                </div>
              )}

              {drawConfirm.group.exchange_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{t("groups.confirmDraw.date")}:</span>
                  <span>{new Date(drawConfirm.group.exchange_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDrawConfirm({ open: false, groupId: "", group: null })}
              className="flex-1"
            >
              {t("groups.confirmDraw.cancel")}
            </Button>
            <Button
              onClick={handleDrawExchange}
              className="flex-1 gap-2"
              disabled={!drawConfirm.group || (drawConfirm.group.members?.length || 0) < 3}
            >
              <Sparkles className="h-4 w-4" />
              {t("groups.confirmDraw.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding modal para cambiar plantilla */}
      <WelcomeOnboarding 
        forceOpen={showTemplateSelection}
        forceView="templates"
        onClose={() => setShowTemplateSelection(false)}
      />

      {/* Confetti cuando se crea el primer intercambio */}
      <ConfettiCelebration 
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      <Footer />
    </div>
  );
};

export default Groups;