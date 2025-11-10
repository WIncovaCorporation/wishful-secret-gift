import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Copy, Check, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Footer from "@/components/Footer";
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
  members?: GroupMember[];
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
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    min_budget: "",
    max_budget: "",
    exchange_date: "",
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
        .select("*")
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
      setDialogOpen(false);
      setNewGroup({
        name: "",
        description: "",
        min_budget: "",
        max_budget: "",
        exchange_date: "",
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

  const handleDrawExchange = async (groupId: string) => {
    if (!user) return;

    try {
      // Get all group members
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      if (!members || members.length < 2) {
        toast.error("Se necesitan al menos 2 miembros para hacer el sorteo");
        return;
      }

      // Create shuffled assignments
      const shuffled = [...members];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Create exchanges
      const exchanges = shuffled.map((giver: any, index: number) => ({
        group_id: groupId,
        giver_id: giver.user_id,
        receiver_id: shuffled[(index + 1) % shuffled.length].user_id,
      }));

      const { error: exchangeError } = await supabase
        .from("gift_exchanges")
        .insert(exchanges);

      if (exchangeError) throw exchangeError;

      const { error: updateError } = await supabase
        .from("groups")
        .update({ is_drawn: true })
        .eq("id", groupId);

      if (updateError) throw updateError;

      toast.success("¡Sorteo realizado! Revisa tu asignación");
      await loadGroups(user.id);
    } catch (error: any) {
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
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              ← Volver
            </Button>
            <h1 className="text-2xl font-bold">Mis Grupos</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <p className="text-muted-foreground">Gestiona tus grupos de intercambio</p>
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
                  <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                  <DialogDescription>Configura tu grupo de intercambio</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <Label htmlFor="group-name">Nombre del Grupo *</Label>
                    <Input
                      id="group-name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Ej: Oficina 2024, Familia Navidad"
                      required
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
                  <Button type="submit" className="w-full">Crear Grupo</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {groups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No tienes grupos aún</h3>
              <p className="text-muted-foreground mb-4">Crea un grupo o únete usando un código</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Grupo
                </Button>
                <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                  Unirse con Código
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {group.created_by === user?.id && !group.is_drawn && (
                        <Button
                          size="sm"
                          onClick={() => handleDrawExchange(group.id)}
                          className="gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Sortear
                        </Button>
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
                    <div>
                      <h4 className="font-semibold mb-2">Código de Invitación</h4>
                      <div className="flex gap-2">
                        <Input value={group.share_code} readOnly className="font-mono" />
                        <Button
                          variant="outline"
                          onClick={() => handleCopyCode(group.share_code)}
                        >
                          {copiedCode === group.share_code ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Miembros ({group.members?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {group.members?.map((member) => (
                          <span
                            key={member.id}
                            className="px-3 py-1 bg-gradient-mint text-secondary-foreground rounded-full text-sm"
                          >
                            {member.profiles?.display_name || "Usuario"}
                          </span>
                        ))}
                      </div>
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

      <Footer />
    </div>
  );
};

export default Groups;