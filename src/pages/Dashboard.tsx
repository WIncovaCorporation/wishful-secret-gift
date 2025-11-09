import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Users, Calendar, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
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
    // Stats will be loaded once types are generated
    // For now, show placeholder data
    setStats({
      myLists: 0,
      myGroups: 0,
      upcomingEvents: 0,
    });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-warm rounded-xl flex items-center justify-center shadow-soft">
              <Gift className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">GiftApp</h1>
              <p className="text-sm text-muted-foreground">Welcome back!</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate("/lists")}
              className="h-auto py-6 flex-col gap-2 shadow-medium hover:shadow-large transition-all"
            >
              <Plus className="w-6 h-6" />
              <span>Create New List</span>
            </Button>
            <Button
              onClick={() => navigate("/groups")}
              variant="secondary"
              className="h-auto py-6 flex-col gap-2 shadow-medium hover:shadow-large transition-all"
            >
              <Users className="w-6 h-6" />
              <span>Join or Create Group</span>
            </Button>
            <Button
              onClick={() => navigate("/events")}
              variant="outline"
              className="h-auto py-6 flex-col gap-2 shadow-soft hover:shadow-medium transition-all"
            >
              <Calendar className="w-6 h-6" />
              <span>Manage Events</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Overview</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <StatsCard
              icon={<Gift className="w-8 h-8" />}
              title="My Lists"
              value={stats.myLists}
              description="Gift lists created"
              gradient="warm"
            />
            <StatsCard
              icon={<Users className="w-8 h-8" />}
              title="My Groups"
              value={stats.myGroups}
              description="Groups joined"
              gradient="mint"
            />
            <StatsCard
              icon={<Calendar className="w-8 h-8" />}
              title="Events"
              value={stats.upcomingEvents}
              description="Upcoming occasions"
              gradient="hero"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete these steps to make the most of GiftApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChecklistItem completed={stats.myLists > 0} text="Create your first gift list" />
            <ChecklistItem completed={stats.myGroups > 0} text="Join or create a group" />
            <ChecklistItem completed={false} text="Invite friends to your group" />
            <ChecklistItem completed={false} text="Set up a secret santa exchange" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const StatsCard = ({ icon, title, value, description, gradient }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
  gradient: "warm" | "mint" | "hero";
}) => (
  <Card className="shadow-medium hover:shadow-large transition-all">
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