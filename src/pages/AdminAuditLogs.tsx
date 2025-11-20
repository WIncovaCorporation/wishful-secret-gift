import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch, 
  GitCommit,
  ExternalLink,
  Trash2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: string;
  repository: string;
  branch: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  workflow_name: string;
  workflow_run_id: string | null;
  event_type: string;
  status: string;
  audit_data: any;
  findings_summary: any;
  created_at: string;
  received_at: string;
}

const AdminAuditLogs = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failure' | 'pending'>('all');

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Agregar timeout de 10 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let query = supabase
        .from('github_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .abortSignal(controller.signal);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching audit logs:', error);
        if (error.code === 'PGRST116') {
          toast.error("No tienes permisos para ver los logs de auditoría");
        } else {
          toast.error("Error al cargar los logs: " + error.message);
        }
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      if (error.name === 'AbortError') {
        toast.error("La carga de logs tardó demasiado. Intenta de nuevo.");
      } else {
        toast.error("Error al cargar los logs de auditoría");
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, filter]);

  const deleteLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('github_audit_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Log eliminado correctamente");
      fetchLogs();
    } catch (error: any) {
      console.error('Error deleting log:', error);
      toast.error("Error al eliminar el log");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failure':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
      case 'queued':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status.toLowerCase() === 'success' || status.toLowerCase() === 'completed' 
      ? 'default' 
      : status.toLowerCase() === 'failure' || status.toLowerCase() === 'failed'
      ? 'destructive'
      : 'secondary';

    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando logs de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Auditorías de GitHub</h1>
          <p className="text-muted-foreground mt-2">
            Informes automáticos de GitHub Actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/corrections')} variant="default">
            Ver Correcciones AI
          </Button>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="success">Exitosos</TabsTrigger>
          <TabsTrigger value="failure">Fallidos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          {logs.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No hay logs de auditoría disponibles
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Los webhooks de GitHub Actions aparecerán aquí automáticamente
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(log.status)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{log.workflow_name}</h3>
                          {getStatusBadge(log.status)}
                          <Badge variant="outline" className="text-xs">
                            {log.event_type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-4 w-4" />
                            <span>{log.repository}</span>
                          </div>
                          {log.branch && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono">{log.branch}</span>
                            </div>
                          )}
                          {log.commit_sha && (
                            <div className="flex items-center gap-1">
                              <GitCommit className="h-4 w-4" />
                              <code className="text-xs">{log.commit_sha.substring(0, 7)}</code>
                            </div>
                          )}
                        </div>

                        {log.commit_message && (
                          <p className="text-sm text-muted-foreground">
                            {log.commit_message}
                          </p>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Recibido: {format(new Date(log.received_at), "PPp", { locale: es })}
                        </div>

                        {log.audit_data?.workflow_url && (
                          <a
                            href={log.audit_data.workflow_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Ver en GitHub
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLog(log.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAuditLogs;