import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Footer from "@/components/Footer";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteRequest = () => {
    if (confirmText !== "DELETE") {
      toast.error("Debes escribir DELETE exactamente para confirmar");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debes estar autenticado para eliminar tu cuenta");
        navigate("/auth");
        return;
      }

      // Call the delete-user-account edge function
      const { error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error("Error deleting account:", error);
        throw error;
      }

      // Sign out the user
      await supabase.auth.signOut();

      toast.success("✅ Tu cuenta ha sido eliminada permanentemente", {
        duration: 5000,
      });
      
      // Redirect to home page
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error: any) {
      console.error("Error completo al eliminar cuenta:", error);
      toast.error(error.message || "Error al eliminar la cuenta. Por favor contacta a support@givlyn.com");
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-2xl shadow-large mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Eliminar Cuenta</h1>
          <p className="text-muted-foreground mt-2">Esta acción no se puede deshacer</p>
        </div>

        <Card className="shadow-large border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">⚠️ Advertencia Crítica</CardTitle>
            <CardDescription>
              Al eliminar tu cuenta, se eliminarán permanentemente:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>Tu perfil y toda tu información personal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>Todos tus grupos y participaciones</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>Todas tus listas de deseos y productos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>Todos tus mensajes anónimos y chats</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>Tus intercambios de regalos activos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>Tu historial completo en la plataforma</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmText" className="text-base font-semibold">
                  Para confirmar, escribe <span className="text-destructive font-mono">DELETE</span> exactamente:
                </Label>
                <Input
                  id="confirmText"
                  type="text"
                  placeholder="Escribe DELETE en mayúsculas"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="font-mono"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteRequest}
                  disabled={loading || confirmText !== "DELETE"}
                  className="flex-1"
                >
                  {loading ? "Eliminando..." : "Eliminar Cuenta Permanentemente"}
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Si tienes problemas o preguntas antes de eliminar tu cuenta, 
                contáctanos en <a href="mailto:support@givlyn.com" className="text-primary hover:underline">
                  support@givlyn.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="¿Estás absolutamente seguro?"
          description="Esta es tu última oportunidad para cancelar. Una vez confirmado, tu cuenta y todos tus datos serán eliminados permanentemente de nuestros servidores. Esta acción NO se puede revertir."
          confirmText="Sí, eliminar mi cuenta"
          cancelText="No, mantener mi cuenta"
          onConfirm={handleDeleteAccount}
          variant="destructive"
        />
      </div>

      <Footer />
    </div>
  );
};

export default DeleteAccount;
