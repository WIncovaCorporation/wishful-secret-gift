import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Copy, 
  AlertTriangle, 
  Info,
  AlertCircle,
  Clock,
  CheckCheck,
  ArrowLeft,
  Home,
  LayoutDashboard
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AICorrection {
  id: string;
  severity: "critical" | "important" | "suggestion";
  file_path: string;
  line_number: number | null;
  issue_title: string;
  issue_description: string;
  code_before: string | null;
  code_after: string | null;
  status: "pending" | "approved" | "rejected" | "applied";
  admin_notes: string | null;
  created_at: string;
  audit_log_id: string;
}

const getSeverityIcon = (severity: AICorrection['severity']) => {
  switch (severity) {
    case "critical":
      return <AlertCircle className="h-5 w-5 text-destructive" aria-label="Severidad crítica" />;
    case "important":
      return <AlertTriangle className="h-5 w-5 text-warning" aria-label="Severidad importante" />;
    default:
      return <Info className="h-5 w-5 text-info" aria-label="Sugerencia" />;
  }
};

const getSeverityBadge = (severity: AICorrection['severity']) => {
  const variants = {
    critical: "destructive",
    important: "default",
    suggestion: "secondary",
  } as const;
  
  return (
    <Badge variant={variants[severity as keyof typeof variants]}>
      {severity.toUpperCase()}
    </Badge>
  );
};

const getStatusIcon = (status: AICorrection['status']) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "applied":
      return <CheckCheck className="h-4 w-4 text-success" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function AdminCorrections() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  const { toast } = useToast();
  const [corrections, setCorrections] = useState<AICorrection[]>([]);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedCorrection, setSelectedCorrection] = useState<AICorrection | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchCorrections();
    }
  }, [isAdmin]);

  const fetchCorrections = async () => {
    const { data, error } = await supabase
      .from("ai_corrections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las correcciones",
        variant: "destructive",
      });
      return;
    }

    setCorrections((data || []) as AICorrection[]);
  };

  const handleCopy = (correction: AICorrection) => {
    const text = `# ${correction.issue_title}

**Archivo:** ${correction.file_path}${correction.line_number ? ` (línea ${correction.line_number})` : ''}
**Severidad:** ${correction.severity}

## Descripción
${correction.issue_description}

${correction.code_before ? `## Código Actual
\`\`\`
${correction.code_before}
\`\`\`
` : ''}

${correction.code_after ? `## Código Sugerido
\`\`\`
${correction.code_after}
\`\`\`
` : ''}`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Corrección copiada al portapapeles",
    });
  };

  const openDialog = (correction: AICorrection, action: "approve" | "reject") => {
    setSelectedCorrection(correction);
    setAdminNotes(correction.admin_notes || "");
    setDialogAction(action);
    setShowDialog(true);
  };

  const handleAction = async () => {
    if (!selectedCorrection || !dialogAction) return;

    const { error } = await supabase
      .from("ai_corrections")
      .update({
        status: dialogAction === "approve" ? "approved" : "rejected",
        admin_notes: adminNotes || null,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedCorrection.id);

    if (error) {
      toast({
        title: "Error",
        description: `No se pudo ${dialogAction === "approve" ? "aprobar" : "rechazar"} la corrección`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: dialogAction === "approve" ? "Aprobada" : "Rechazada",
      description: `Corrección ${dialogAction === "approve" ? "aprobada" : "rechazada"} exitosamente`,
    });

    setShowDialog(false);
    setSelectedCorrection(null);
    setAdminNotes("");
    setDialogAction(null);
    fetchCorrections();
  };

  const filterCorrections = (status: string) => {
    return corrections.filter((c) => c.status === status);
  };

  const approvedCount = filterCorrections("approved").length;
  const pendingCount = filterCorrections("pending").length;

  const handleApproveAll = async () => {
    const pending = filterCorrections("pending");
    if (pending.length === 0) return;

    const { error } = await supabase
      .from("ai_corrections")
      .update({ 
        status: "approved",
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("status", "pending");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron aprobar las correcciones",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Aprobadas",
      description: `${pending.length} correcciones aprobadas exitosamente`,
    });
    fetchCorrections();
  };

  const handleRejectAll = async () => {
    const pending = filterCorrections("pending");
    if (pending.length === 0) return;

    const { error } = await supabase
      .from("ai_corrections")
      .update({ 
        status: "rejected",
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("status", "pending");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron rechazar las correcciones",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Rechazadas",
      description: `${pending.length} correcciones rechazadas`,
    });
    fetchCorrections();
  };

  const handleCopyAll = () => {
    const pending = filterCorrections("pending");
    const text = pending.map(c => `# ${c.issue_title}
**Archivo:** ${c.file_path}${c.line_number ? ` (línea ${c.line_number})` : ''}
**Severidad:** ${c.severity}

## Descripción
${c.issue_description}

${c.code_before ? `## Código Actual
\`\`\`
${c.code_before}
\`\`\`
` : ''}

${c.code_after ? `## Código Sugerido
\`\`\`
${c.code_after}
\`\`\`
` : ''}
---
`).join('\n\n');

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${pending.length} correcciones copiadas al portapapeles`,
    });
  };

  const handleApplyCorrections = async () => {
    const approved = filterCorrections("approved");
    if (approved.length === 0) {
      toast({
        title: "Sin correcciones",
        description: "No hay correcciones aprobadas para aplicar",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    let appliedCount = 0;
    let errorCount = 0;

    for (const correction of approved) {
      if (!correction.code_before || !correction.code_after || !correction.line_number) {
        errorCount++;
        continue;
      }

      try {
        // Aquí el usuario deberá aplicar manualmente cada corrección
        // Por ahora solo marcamos como "applied" y mostramos la info
        const { error } = await supabase
          .from("ai_corrections")
          .update({ 
            status: "applied",
            applied_at: new Date().toISOString(),
          })
          .eq("id", correction.id);

        if (!error) {
          appliedCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }

    setIsApplying(false);
    
    toast({
      title: appliedCount > 0 ? "Correcciones marcadas" : "Error",
      description: appliedCount > 0 
        ? `${appliedCount} correcciones marcadas como aplicadas. ${errorCount > 0 ? `${errorCount} fallaron.` : ''}`
        : "No se pudieron marcar las correcciones",
      variant: errorCount > 0 ? "destructive" : "default",
    });

    fetchCorrections();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No tienes permisos para acceder a esta página</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Barra de navegación */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Inicio
        </Button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Correcciones AI</h1>
          <p className="text-muted-foreground">
            Revisa y aprueba las correcciones sugeridas por OpenAI
          </p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleApproveAll}
              >
                <CheckCircle className="h-5 w-5" />
                Aprobar Todas ({pendingCount})
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleRejectAll}
              >
                <XCircle className="h-5 w-5" />
                Rechazar Todas
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleCopyAll}
              >
                <Copy className="h-5 w-5" />
                Copiar Todas
              </Button>
            </>
          )}
          {approvedCount > 0 && (
            <Button 
              size="lg" 
              className="gap-2"
              onClick={handleApplyCorrections}
              disabled={isApplying}
            >
              <CheckCheck className="h-5 w-5" />
              {isApplying ? "Aplicando..." : `Aplicar ${approvedCount} Correcciones`}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pendientes ({filterCorrections("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprobadas ({filterCorrections("approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rechazadas ({filterCorrections("rejected").length})
          </TabsTrigger>
          <TabsTrigger value="applied">
            Aplicadas ({filterCorrections("applied").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filterCorrections(selectedTab).length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No hay correcciones {selectedTab === "pending" ? "pendientes" : selectedTab}
              </p>
            </Card>
          ) : (
            filterCorrections(selectedTab).map((correction) => (
              <Card key={correction.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(correction.severity)}</div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{correction.issue_title}</h3>
                          {getSeverityBadge(correction.severity)}
                          {getStatusIcon(correction.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {correction.file_path}
                          {correction.line_number && ` : ${correction.line_number}`}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm">{correction.issue_description}</p>

                    {correction.code_before && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Código Actual:</p>
                        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                          <code>{correction.code_before}</code>
                        </pre>
                      </div>
                    )}

                    {correction.code_after && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Código Sugerido:</p>
                        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                          <code>{correction.code_after}</code>
                        </pre>
                      </div>
                    )}

                    {correction.admin_notes && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Notas del Admin:</p>
                        <p className="text-sm text-muted-foreground">{correction.admin_notes}</p>
                      </div>
                    )}

                    {correction.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2"
                          onClick={() => openDialog(correction, "approve")}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => openDialog(correction, "reject")}
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleCopy(correction)}
                        >
                          <Copy className="h-4 w-4" />
                          Copiar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Aprobar" : "Rechazar"} Corrección
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? "Esta corrección será marcada como aprobada y estará lista para aplicar."
                : "Esta corrección será marcada como rechazada y no se aplicará."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Agrega notas sobre esta decisión..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={handleAction}
            >
              {dialogAction === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
