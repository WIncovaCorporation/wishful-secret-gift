/**
 * WelcomeOnboarding Component - Parte 1/3
 * Modal de bienvenida inicial que se muestra SOLO después del primer registro
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";

export const WelcomeOnboarding = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        // Esperar 500ms para que cargue el dashboard primero
        setTimeout(() => {
          setOpen(true);
          analytics.trackEvent('onboarding_started');
        }, 500);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const markOnboardingCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating onboarding status:', error);
      }
    } catch (error) {
      console.error('Error marking onboarding completed:', error);
    }
  };

  const handleClose = async () => {
    setOpen(false);
    await markOnboardingCompleted();
    analytics.trackEvent('onboarding_closed');
  };

  const handleCreateExchange = async () => {
    setOpen(false);
    await markOnboardingCompleted();
    analytics.trackEvent('onboarding_completed', { action: 'create_exchange' });
    navigate("/groups");
  };

  const handleViewTutorial = async () => {
    setOpen(false);
    await markOnboardingCompleted();
    analytics.trackEvent('onboarding_completed', { action: 'view_tutorial' });
    toast.info("Tutorial próximamente disponible 🎓");
  };

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="px-8 py-12 text-center bg-gradient-to-b from-background to-muted/20">
          {/* Logo Givlyn */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Givlyn
            </h1>
          </div>

          {/* Animated Gift Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
              <Gift className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl font-bold mb-4 text-foreground animate-fade-in">
            Regala lo que realmente quieren
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed animate-fade-in max-w-md mx-auto">
            Organiza intercambios donde todos comparten sus deseos
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 justify-center max-w-sm mx-auto">
            <Button
              onClick={handleCreateExchange}
              size="lg"
              className="w-full text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Gift className="w-5 h-5 mr-2" />
              Crear mi intercambio
            </Button>
            
            <Button
              onClick={handleViewTutorial}
              variant="outline"
              size="lg"
              className="w-full text-base font-semibold hover:bg-accent transition-all duration-300"
            >
              Ver cómo funciona
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook para resetear el onboarding (útil para testing/admin)
export const useResetOnboarding = () => {
  const resetOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ onboarding_completed: false })
        .eq('user_id', user.id);

      window.location.reload();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return resetOnboarding;
};
