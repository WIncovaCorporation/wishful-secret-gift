import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Database, 
  FileText, 
  GitBranch, 
  Settings,
  ArrowLeft,
  BarChart3
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

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

  const handleOpenBackend = () => {
    // Intentar abrir el backend mediante postMessage
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'lov-open-backend' }, '*');
    }
    
    toast.info("Abriendo base de datos...", {
      description: "Si no se abre automáticamente, usa el icono de Cloud ☁️ en la barra superior"
    });
  };

  const adminCards = [
    {
      title: "Base de Datos",
      description: "Accede directamente a las tablas, datos y configuración de la base de datos",
      icon: Database,
      color: "text-blue-500",
      action: "open-backend",
      buttonText: "Abrir Base de Datos"
    },
    {
      title: "Logs de Auditoría",
      description: "Revisa los logs de auditoría automática del sistema GitHub",
      icon: GitBranch,
      color: "text-purple-500",
      route: "/admin/audit-logs",
      buttonText: "Ver Logs"
    },
    {
      title: "Correcciones AI",
      description: "Gestiona las correcciones automáticas sugeridas por el sistema",
      icon: FileText,
      color: "text-green-500",
      route: "/admin/corrections",
      buttonText: "Ver Correcciones"
    },
    {
      title: "Estadísticas",
      description: "Visualiza métricas y estadísticas del sistema",
      icon: BarChart3,
      color: "text-orange-500",
      route: "/admin/stats",
      buttonText: "Ver Estadísticas"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Panel de Administración</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Gestiona todos los aspectos del sistema desde aquí
          </p>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`h-6 w-6 ${card.color}`} />
                    <CardTitle>{card.title}</CardTitle>
                  </div>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {card.action === "open-backend" ? (
                    <Button 
                      className="w-full"
                      onClick={handleOpenBackend}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      {card.buttonText}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => navigate(card.route!)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {card.buttonText}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Rápido</CardTitle>
              <CardDescription>
                Funciones administrativas frecuentes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleOpenBackend}
              >
                <Database className="mr-2 h-4 w-4" />
                Base de Datos
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin/audit-logs")}
              >
                <GitBranch className="mr-2 h-4 w-4" />
                Auditoría
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin/corrections")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Correcciones
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
