/**
 * WelcomeOnboarding Component
 * Modal de bienvenida que se muestra SOLO la primera vez después del registro
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gift, Users, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { analytics } from "@/lib/analytics";

const ONBOARDING_COMPLETED_KEY = "givlyn_welcome_onboarding_completed";

export const WelcomeOnboarding = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Verificar si ya completó el onboarding
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    
    if (!completed) {
      // Esperar 500ms para que cargue el dashboard primero
      const timer = setTimeout(() => {
        setOpen(true);
        analytics.trackEvent('onboarding_started');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      analytics.trackEvent('onboarding_step_completed', { step: currentStep + 1 });
    }
  };

  const handleSkip = () => {
    setOpen(false);
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    analytics.trackEvent('onboarding_skipped', { step: currentStep + 1 });
  };

  const handleCreateExchange = () => {
    setOpen(false);
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    analytics.trackEvent('onboarding_completed', { action: 'create_exchange' });
    navigate("/groups");
  };

  const steps = [
    {
      icon: <Gift className="w-16 h-16 text-primary" />,
      title: t("onboarding.step1.title"),
      description: t("onboarding.step1.description"),
    },
    {
      icon: <Users className="w-16 h-16 text-primary" />,
      title: t("onboarding.step2.title"),
      description: t("onboarding.step2.description"),
      bullets: [
        t("onboarding.step2.bullet1"),
        t("onboarding.step2.bullet2"),
        t("onboarding.step2.bullet3"),
      ],
    },
    {
      icon: <Sparkles className="w-16 h-16 text-primary" />,
      title: t("onboarding.step3.title"),
      description: t("onboarding.step3.description"),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleSkip();
    }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("close")}</span>
        </button>

        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center mt-2">
            {currentStep + 1} / {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
              {currentStepData.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-4 animate-fade-in">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-6 text-base leading-relaxed animate-fade-in">
            {currentStepData.description}
          </p>

          {/* Bullets (Step 2 only) */}
          {currentStepData.bullets && (
            <ul className="text-left space-y-3 mb-6 max-w-sm mx-auto">
              {currentStepData.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm text-foreground">{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center mt-8">
            {currentStep < 2 ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="min-w-[120px]"
                >
                  {t("skip")}
                </Button>
                <Button
                  onClick={handleNext}
                  className="min-w-[120px] gap-2"
                >
                  {t("next")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="min-w-[140px]"
                >
                  {t("onboarding.skipForNow")}
                </Button>
                <Button
                  onClick={handleCreateExchange}
                  className="min-w-[180px] gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Gift className="w-4 h-4" />
                  {t("onboarding.createExchange")}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook para resetear el onboarding (útil para testing)
export const useResetOnboarding = () => {
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    window.location.reload();
  };

  return resetOnboarding;
};
