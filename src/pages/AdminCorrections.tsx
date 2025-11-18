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
  LayoutDashboard,
  Square,
  CheckSquare
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema de validación para notas de admin
const adminNotesSchema = z.string()
  .max(1000, "Las notas no pueden exceder 1000 caracteres")
  .trim()
  .optional();

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
      return <CheckCircle className="h-4 w-4 text-success" aria-label="Aprobado" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive" aria-label="Rechazado" />;
    case "applied":
      return <CheckCheck className="h-4 w-4 text-success" aria-label="Aplicado" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" aria-label="Pendiente" />;
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
  const [selectedForApply, setSelectedForApply] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<string>("all");

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

    // Validar y sanitizar las notas de admin
    try {
      const sanitizedNotes = adminNotes ? adminNotesSchema.parse(adminNotes) : null;

      const { error } = await supabase
        .from("ai_corrections")
        .update({
          status: dialogAction === "approve" ? "approved" : "rejected",
          admin_notes: sanitizedNotes || null,
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
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: validationError.errors[0]?.message || "Las notas contienen errores",
          variant: "destructive",
        });
      }
    }
  };

  const filterCorrections = (status: string) => {
    let filtered = corrections.filter((c) => c.status === status);
    
    if (severityFilter !== "all") {
      filtered = filtered.filter((c) => c.severity === severityFilter);
    }
    
    return filtered;
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

  const toggleSelectCorrection = (correctionId: string) => {
    setSelectedForApply(prev => {
      const newSet = new Set(prev);
      if (newSet.has(correctionId)) {
        newSet.delete(correctionId);
      } else {
        newSet.add(correctionId);
      }
      return newSet;
    });
  };

  const selectAllInTab = () => {
    const tabCorrections = filterCorrections(selectedTab);
    setSelectedForApply(new Set(tabCorrections.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedForApply(new Set());
  };

  const handleApplyCorrections = async () => {
    if (selectedForApply.size === 0) {
      toast({
        title: "Sin correcciones seleccionadas",
        description: "Selecciona al menos una corrección para aplicar",
        variant: "destructive",
      });
      return;
    }

    const selectedCorrections = corrections.filter(c => selectedForApply.has(c.id));
    
    // Copiar comando para el chat de Lovable
    const message = `Aplica automáticamente las ${selectedForApply.size} correcciones seleccionadas. Los IDs son: ${Array.from(selectedForApply).join(', ')}. Lee la API GET /functions/v1/get-approved-corrections, aplica cada corrección al código usando lov-line-replace, y marca como aplicadas llamando a POST /functions/v1/mark-corrections-applied con estos IDs.`;
    
    navigator.clipboard.writeText(message);
    
    toast({
      title: "✅ Comando copiado al portapapeles",
      description: `Pega el comando en el chat de Lovable para aplicar ${selectedForApply.size} correcciones automáticamente`,
      duration: 8000,
    });
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Correcciones AI</h1>
          <p className="text-muted-foreground">
            Revisa y aprueba las correcciones sugeridas por OpenAI
          </p>
          {selectedForApply.size > 0 && (
            <p className="text-sm font-medium text-primary mt-2">
              {selectedForApply.size} corrección(es) seleccionada(s) para aplicar
            </p>
          )}
          
          {/* Filtro de severidad */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm font-medium">Filtrar por severidad:</span>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Críticas
                  </div>
                </SelectItem>
                <SelectItem value="important">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Importantes
                  </div>
                </SelectItem>
                <SelectItem value="suggestion">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-info" />
                    Sugerencias
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {severityFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSeverityFilter("all")}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Limpiar filtro
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {selectedForApply.size > 0 && (
            <>
              <Button 
                variant="default" 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={handleApplyCorrections}
              >
                <CheckCheck className="h-5 w-5" />
                Aplicar Seleccionadas ({selectedForApply.size})
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={clearSelection}
              >
                <XCircle className="h-5 w-5" />
                Limpiar Selección
              </Button>
            </>
          )}
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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={selectAllInTab}
          >
            <CheckSquare className="h-4 w-4" />
            Seleccionar Todas en {selectedTab === 'pending' ? 'Pendientes' : selectedTab === 'approved' ? 'Aprobadas' : selectedTab === 'rejected' ? 'Rechazadas' : 'Aplicadas'}
          </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 mt-1"
                    onClick={() => toggleSelectCorrection(correction.id)}
                  >
                    {selectedForApply.has(correction.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                  
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
                maxLength={1000}
                aria-describedby="notes-hint"
              />
              <p id="notes-hint" className="text-xs text-muted-foreground mt-1">
                Máximo 1000 caracteres ({adminNotes.length}/1000)
              </p>
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
