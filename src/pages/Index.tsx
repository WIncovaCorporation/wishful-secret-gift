import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gift, Users, Sparkles, Shield, LogOut, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import heroImage from "@/assets/hero-gifts.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t("dashboard.signedOut"));
      setUser(null);
    } catch (error) {
      toast.error(t("dashboard.signOutFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header with User Info */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-warm rounded-xl flex items-center justify-center shadow-soft">
              <Gift className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">GiftApp</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario'}
                  </span>
                </div>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  size="sm"
                  variant="outline"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={handleSignOut}
                  size="sm"
                  variant="ghost"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => navigate("/auth")}
                size="sm"
              >
                {t("auth.signIn")}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        
        <div className="container mx-auto px-4 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 bg-gradient-warm text-primary-foreground rounded-full text-sm font-medium shadow-medium">
                  {t("hero.badge")}
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                {t("hero.title")}
                <span className="block bg-gradient-warm bg-clip-text text-transparent">
                  {t("hero.titleHighlight")}
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t("hero.description")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 shadow-large hover:shadow-glow transition-all"
                  onClick={() => navigate("/auth")}
                >
                  {t("hero.cta")}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  onClick={() => navigate("/dashboard")}
                >
                  {t("hero.demo")}
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-warm rounded-3xl blur-3xl opacity-20" />
              <img 
                src={heroImage} 
                alt="Beautiful gift boxes"
                className="relative rounded-3xl shadow-large w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t("features.title")}</h2>
            <p className="text-xl text-muted-foreground">{t("features.subtitle")}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Gift className="w-8 h-8" />}
              title={t("features.lists.title")}
              description={t("features.lists.description")}
              onClick={() => navigate("/lists")}
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title={t("features.groups.title")}
              description={t("features.groups.description")}
              onClick={() => navigate("/groups")}
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title={t("features.events.title")}
              description={t("features.events.description")}
              onClick={() => navigate("/events")}
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title={t("features.privacy.title")}
              description={t("features.privacy.description")}
              onClick={() => navigate("/dashboard")}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-warm rounded-3xl p-12 text-center shadow-large">
            <h2 className="text-4xl font-bold text-primary-foreground mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              {t("cta.subtitle")}
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              {t("cta.button")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, onClick }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  onClick?: () => void;
}) => (
  <div 
    onClick={onClick}
    className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all cursor-pointer hover:scale-105 hover:border-primary/50"
  >
    <div className="w-16 h-16 bg-gradient-warm rounded-2xl flex items-center justify-center text-primary-foreground mb-4 shadow-soft">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-3">{description}</p>
    <div className="text-sm font-medium text-primary flex items-center gap-1">
      Ir a {title} →
    </div>
  </div>
);

export default Index;