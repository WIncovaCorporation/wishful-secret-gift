import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Users, Calendar, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { OnboardingTour } from "@/components/OnboardingTour";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SkipToContent } from "@/components/SkipToContent";
import Footer from "@/components/Footer";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myLists: 0,
    myGroups: 0,
    upcomingEvents: 0,
  });

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t("dashboard.signedOut"));
      navigate("/");
    } catch (error) {
      toast.error(t("dashboard.signOutFailed"));
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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <SkipToContent />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-warm rounded-xl flex items-center justify-center shadow-soft">
              <Gift className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">GiftApp</h1>
              <p className="text-sm text-muted-foreground">{t("dashboard.welcomeBack")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="outline" size="sm" onClick={handleSignOut} aria-label={t("dashboard.signOut")}>
              <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("dashboard.signOut")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8" data-tour="quick-actions">
          <h2 className="text-2xl font-bold mb-4">{t("dashboard.quickActions")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Stats Overview */}
        <div className="mb-8" data-tour="stats-overview">
          <h2 className="text-2xl font-bold mb-4">{t("dashboard.overview")}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
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

        {/* Recent Activity */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>{t("dashboard.gettingStarted")}</CardTitle>
            <CardDescription>{t("dashboard.gettingStartedDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChecklistItem completed={stats.myLists > 0} text={t("dashboard.step1")} />
            <ChecklistItem completed={stats.myGroups > 0} text={t("dashboard.step2")} />
            <ChecklistItem completed={false} text={t("dashboard.step3")} />
            <ChecklistItem completed={false} text={t("dashboard.step4")} />
          </CardContent>
        </Card>
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

const ChecklistItem = ({ completed, text }: { completed: boolean; text: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
      completed ? "bg-gradient-warm text-primary-foreground" : "border-2 border-border"
    }`}>
      {completed && "✓"}
    </div>
    <span className={completed ? "line-through text-muted-foreground" : ""}>{text}</span>
  </div>
);

export default Dashboard;