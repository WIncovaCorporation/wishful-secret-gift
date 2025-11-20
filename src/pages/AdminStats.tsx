import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Users,
  Gift,
  MessageCircle,
  Calendar,
  TrendingUp,
  Database,
  ShoppingBag
} from "lucide-react";

const AdminStats = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalLists: 0,
    totalGiftItems: 0,
    totalMessages: 0,
    totalExchanges: 0,
    totalProducts: 0,
    activeGroups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas de todas las tablas
      const [
        { count: usersCount },
        { count: groupsCount },
        { count: listsCount },
        { count: itemsCount },
        { count: messagesCount },
        { count: exchangesCount },
        { count: productsCount },
        { count: activeGroupsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true }),
        supabase.from('gift_lists').select('*', { count: 'exact', head: true }),
        supabase.from('gift_items').select('*', { count: 'exact', head: true }),
        supabase.from('anonymous_messages').select('*', { count: 'exact', head: true }),
        supabase.from('gift_exchanges').select('*', { count: 'exact', head: true }),
        supabase.from('affiliate_products').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true }).eq('is_drawn', true)
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalGroups: groupsCount || 0,
        totalLists: listsCount || 0,
        totalGiftItems: itemsCount || 0,
        totalMessages: messagesCount || 0,
        totalExchanges: exchangesCount || 0,
        totalProducts: productsCount || 0,
        activeGroups: activeGroupsCount || 0
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    {
      title: "Usuarios Totales",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Grupos Creados",
      value: stats.totalGroups,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    },
    {
      title: "Grupos Activos",
      value: stats.activeGroups,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Listas de Deseos",
      value: stats.totalLists,
      icon: Gift,
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950"
    },
    {
      title: "Productos en Listas",
      value: stats.totalGiftItems,
      icon: ShoppingBag,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950"
    },
    {
      title: "Mensajes Anónimos",
      value: stats.totalMessages,
      icon: MessageCircle,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950"
    },
    {
      title: "Intercambios Realizados",
      value: stats.totalExchanges,
      icon: Calendar,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950"
    },
    {
      title: "Productos Afiliados",
      value: stats.totalProducts,
      icon: Database,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel Admin
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Estadísticas del Sistema</h1>
              <p className="text-muted-foreground text-lg">
                Vista general de métricas y datos del sistema
              </p>
            </div>
            <Button onClick={loadStats} variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total registrado
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumen General</CardTitle>
              <CardDescription>
                Indicadores clave del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Tasa de Actividad</p>
                  <p className="text-2xl font-bold">
                    {stats.totalGroups > 0 
                      ? Math.round((stats.activeGroups / stats.totalGroups) * 100) 
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Grupos activos vs totales
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Productos por Lista</p>
                  <p className="text-2xl font-bold">
                    {stats.totalLists > 0 
                      ? Math.round(stats.totalGiftItems / stats.totalLists) 
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Promedio de items
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Mensajes por Grupo</p>
                  <p className="text-2xl font-bold">
                    {stats.activeGroups > 0 
                      ? Math.round(stats.totalMessages / stats.activeGroups) 
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Promedio de mensajes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
