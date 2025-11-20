import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Users, Calendar, Plus, MessageCircle, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SkipToContent } from "@/components/SkipToContent";
import { ProfileMenu } from "@/components/ProfileMenu";
import Footer from "@/components/Footer";
import { useUserRole } from "@/hooks/useUserRole";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { OnboardingTour } from "@/components/OnboardingTour";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isFree } = useUserRole();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFreeBanner, setShowFreeBanner] = useState(false);
  const [stats, setStats] = useState({
    myLists: 0,
    myGroups: 0,
    upcomingEvents: 0,
  });
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await loadStats(session.user.id);
      await loadActiveAssignments(session.user.id);
      
      // Show free banner for free users
      if (isFree()) {
        setTimeout(() => setShowFreeBanner(true), 2000);
      }
      
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async (userId: string) => {
    try {
      // Load lists count
      const { data: lists, error: listsError } = await supabase
        .from("gift_lists")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      // Load groups count
      const { data: groupMembers, error: groupsError } = await supabase
        .from("group_members")
        .select("group_id", { count: "exact" })
        .eq("user_id", userId);

      // Load upcoming events count
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id", { count: "exact" })
        .eq("created_by", userId)
        .gte("date", new Date().toISOString().split('T')[0]);

      if (listsError || groupsError || eventsError) {
        console.error("Error loading stats:", listsError || groupsError || eventsError);
      }

      setStats({
        myLists: lists?.length || 0,
        myGroups: groupMembers?.length || 0,
        upcomingEvents: events?.length || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };

  const loadActiveAssignments = async (userId: string) => {
    try {
      const { data: exchanges, error } = await supabase
        .from("gift_exchanges")
        .select(`
          group_id,
          receiver_id,
          groups (
            id,
            name,
            exchange_date
          )
        `)
        .eq("giver_id", userId);

      if (error) throw error;

      setActiveAssignments(exchanges || []);
    } catch (error) {
      console.error("Error loading active assignments:", error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <LoadingSpinner message={t("dashboard.loading")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <WelcomeOnboarding />
      <OnboardingTour />
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <SkipToContent />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-warm rounded-xl flex items-center justify-center shadow-soft">
              <Gift className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Givlyn</h1>
              <p className="text-sm text-muted-foreground">{t("dashboard.welcomeBack")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {user && <ProfileMenu user={user} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        {showFreeBanner && (
          <div className="mb-6">
            <UpgradePrompt
              variant="banner"
              title="¡Desbloquea todo el potencial de Givlyn!"
              description="Grupos y listas ilimitados, chat anónimo con tu asignado, sugerencias con IA y más."
              feature="premium_features"
              onDismiss={() => setShowFreeBanner(false)}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8" data-tour="quick-actions">
          <h2 className="text-2xl font-bold mb-4">{t("dashboard.quickActions")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              data-tour="create-list"
              onClick={() => navigate("/lists")}
              className="h-auto py-6 flex-col gap-2 shadow-medium hover:shadow-large transition-all"
              aria-label={t("dashboard.createList")}
            >
              <Plus className="w-6 h-6" aria-hidden="true" />
              <span>{t("dashboard.createList")}</span>
            </Button>
            <Button
              onClick={() => navigate("/groups")}
              variant="secondary"
              className="h-auto py-6 flex-col gap-2 shadow-medium hover:shadow-large transition-all"
              aria-label={t("dashboard.joinGroup")}
            >
              <Users className="w-6 h-6" aria-hidden="true" />
              <span>{t("dashboard.joinGroup")}</span>
            </Button>
            <Button
              onClick={() => navigate("/messages")}
              variant="default"
              className="h-auto py-6 flex-col gap-2 shadow-medium hover:shadow-large transition-all bg-gradient-to-br from-orange-500 to-pink-500"
              aria-label="Mis Mensajes"
            >
              <MessageCircle className="w-6 h-6" aria-hidden="true" />
              <span>Mis Mensajes</span>
            </Button>
            <Button
              data-tour="ai-suggestions"
              onClick={() => navigate("/events")}
              variant="outline"
              className="h-auto py-6 flex-col gap-2 shadow-soft hover:shadow-medium transition-all"
              aria-label={t("dashboard.planEvent")}
            >
              <Calendar className="w-6 h-6" aria-hidden="true" />
              <span>{t("dashboard.manageEvents")}</span>
            </Button>
          </div>
        </div>

        {/* Marketplace & Affiliate Section */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card 
            className="shadow-medium hover:shadow-large transition-all cursor-pointer hover:scale-105 active:scale-95"
            onClick={() => navigate("/marketplace")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-soft">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Marketplace</h3>
                  <p className="text-sm text-muted-foreground">Descubre productos recomendados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-medium hover:shadow-large transition-all cursor-pointer hover:scale-105 active:scale-95"
            onClick={() => navigate("/my-products")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-soft">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Mis Productos</h3>
                  <p className="text-sm text-muted-foreground">Gestiona tus enlaces de afiliado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="mb-8" data-tour="stats-overview">
          <h2 className="text-2xl font-bold mb-4">{t("dashboard.overview")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <StatsCard
              icon={<Gift className="w-8 h-8" />}
              title={t("dashboard.myLists")}
              value={stats.myLists}
              description={t("dashboard.listsCreated")}
              gradient="warm"
              onClick={() => navigate("/lists")}
            />
            <StatsCard
              icon={<Users className="w-8 h-8" />}
              title={t("dashboard.myGroups")}
              value={stats.myGroups}
              description={t("dashboard.groupsJoined")}
              gradient="mint"
              onClick={() => navigate("/groups")}
            />
            <StatsCard
              icon={<Calendar className="w-8 h-8" />}
              title={t("dashboard.events")}
              value={stats.upcomingEvents}
              description={t("dashboard.upcomingOccasions")}
              gradient="hero"
              onClick={() => navigate("/events")}
            />
          </div>
        </div>

        {/* Getting Started Checklist - Dynamic */}
        <Card className="shadow-medium mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("dashboard.gettingStarted")}
            </CardTitle>
            <CardDescription>{t("dashboard.gettingStartedDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ChecklistItem 
              completed={stats.myLists > 0} 
              text={t("dashboard.step1")} 
              onClick={() => !stats.myLists && navigate("/lists")}
            />
            <ChecklistItem 
              completed={stats.myGroups > 0} 
              text={t("dashboard.step2")}
              onClick={() => !stats.myGroups && navigate("/groups")}
            />
            <ChecklistItem 
              completed={stats.myLists > 0 && stats.myGroups > 0} 
              text={t("dashboard.step3")}
              onClick={() => !(stats.myLists > 0 && stats.myGroups > 0) && navigate("/groups")}
            />
            <ChecklistItem 
              completed={stats.upcomingEvents > 0} 
              text={t("dashboard.step4")}
              onClick={() => !stats.upcomingEvents && navigate("/events")}
            />
          </CardContent>
        </Card>

        {/* Active Assignments Section */}
        {activeAssignments.length > 0 && (
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t("dashboard.myAssignments")}
              </CardTitle>
              <CardDescription>{t("dashboard.myAssignmentsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeAssignments.map((assignment: any) => (
                <div
                  key={assignment.group_id}
                  className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{assignment.groups?.name}</h4>
                    {assignment.groups?.exchange_date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(assignment.groups.exchange_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/groups/${assignment.group_id}/assignment`)}
                    className="gap-2"
                  >
                    <Gift className="h-4 w-4" />
                    {t("dashboard.viewAssignment")}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
      <OnboardingTour />
    </div>
  );
};

const StatsCard = ({ icon, title, value, description, gradient, onClick }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
  gradient: "warm" | "mint" | "hero";
  onClick: () => void;
}) => (
  <Card 
    className="shadow-medium hover:shadow-large transition-all cursor-pointer hover:scale-105 active:scale-95" 
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <CardContent className="pt-6">
      <div className={`w-14 h-14 bg-gradient-${gradient} rounded-2xl flex items-center justify-center text-primary-foreground mb-4 shadow-soft`}>
        {icon}
      </div>
      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const ChecklistItem = ({ completed, text, onClick }: { completed: boolean; text: string; onClick?: () => void }) => (
  <div 
    className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
      completed 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' 
        : 'bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50'
    } ${onClick && !completed ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
      completed 
        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-110" 
        : "border-2 border-muted-foreground/30"
    }`}>
      {completed && (
        <svg className="w-5 h-5 animate-scale-in" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M5 13l4 4L19 7"></path>
        </svg>
      )}
    </div>
    <span className={`font-medium transition-all duration-300 ${
      completed ? 'text-green-700 dark:text-green-400' : 'text-foreground'
    }`}>
      {text}
    </span>
    {completed && (
      <span className="ml-auto px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 animate-fade-in">
        Completado
      </span>
    )}
  </div>
);

export default Dashboard;