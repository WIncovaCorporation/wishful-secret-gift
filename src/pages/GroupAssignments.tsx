import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import LanguageSelector from "@/components/LanguageSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Assignment {
  giver_id: string;
  receiver_id: string;
  giver_profile?: {
    display_name: string;
  };
  receiver_profile?: {
    display_name: string;
  };
}

interface Group {
  name: string;
  created_by: string;
  is_drawn: boolean;
}

const GroupAssignments = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, [groupId]);

  const loadAssignments = async () => {
    try {
      // Validate groupId
      if (!groupId || groupId === ':groupId') {
        setError('ID de grupo inválido');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get group info
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("name, created_by, is_drawn")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      setGroup(groupData);
      const userIsCreator = groupData.created_by === session.user.id;
      setIsCreator(userIsCreator);

      // Only allow creator to view all assignments
      if (!userIsCreator) {
        navigate(`/groups/${groupId}/assignment`);
        return;
      }

      // Get all assignments for this group
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("gift_exchanges")
        .select(`
          giver_id,
          receiver_id
        `)
        .eq("group_id", groupId);

      if (assignmentsError) throw assignmentsError;

      // Get profiles for all users
      const userIds = new Set<string>();
      assignmentsData?.forEach((a) => {
        userIds.add(a.giver_id);
        userIds.add(a.receiver_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const enrichedAssignments = assignmentsData?.map((a) => ({
        ...a,
        giver_profile: profileMap.get(a.giver_id),
        receiver_profile: profileMap.get(a.receiver_id),
      })) || [];

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error("Error loading assignments:", error);
      setError('Error al cargar las asignaciones. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando asignaciones..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/groups")} className="w-full">
              Volver a Grupos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCreator) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/groups")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Grupos
          </Button>
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with Admin Badge */}
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="mb-2">
              <Shield className="h-3 w-3 mr-1" />
              Vista de Administrador
            </Badge>
            <h1 className="text-3xl font-bold">Todas las Asignaciones</h1>
            <p className="text-muted-foreground">{group?.name}</p>
          </div>

          {/* Warning Alert */}
          <Alert className="border-yellow-500/50 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-sm">
              <strong>⚠️ Confidencial:</strong> Esta información es solo para administración. 
              Solo el creador del grupo puede ver todas las asignaciones para resolver problemas o disputas.
              No compartas esta información con los participantes.
            </AlertDescription>
          </Alert>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista Completa de Asignaciones ({assignments.length})
              </CardTitle>
              <CardDescription>
                Registro verificable del sorteo para resolución de disputas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignments.map((assignment, index) => (
                  <div
                    key={`${assignment.giver_id}-${assignment.receiver_id}`}
                    className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">
                          {assignment.giver_profile?.display_name || "Usuario"}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-primary">
                          {assignment.receiver_profile?.display_name || "Usuario"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {assignment.giver_profile?.display_name} le regala a{" "}
                        {assignment.receiver_profile?.display_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-500/50 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-lg">📋 Uso de esta información</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong>✅ Puedes usar esto para:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Resolver disputas si alguien dice que le tocó otra persona</li>
                <li>Verificar que el sorteo se realizó correctamente</li>
                <li>Confirmar asignaciones en caso de problemas técnicos</li>
              </ul>
              <p className="mt-3">
                <strong>❌ NO debes:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Compartir esta información con los participantes</li>
                <li>Modificar manualmente las asignaciones (vuelve a sortear si es necesario)</li>
                <li>Revelar quién le toca a quién antes del intercambio</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GroupAssignments;
