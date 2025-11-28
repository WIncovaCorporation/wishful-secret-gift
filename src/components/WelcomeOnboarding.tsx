/**
 * WelcomeOnboarding Component - Parte 2/3
 * Modal de bienvenida con tutorial de 3 pasos y plantillas de ocasiones
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  X, 
  CheckCircle, 
  Mail, 
  Sparkles, 
  Calendar, 
  Briefcase, 
  PartyPopper 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";

type OnboardingView = 'initial' | 'tutorial' | 'templates';

interface TemplateData {
  name: string;
  description: string;
  min_budget: string;
  max_budget: string;
  exchange_date: string;
  notification_mode: string;
  suggested_budget: string;
}

interface WelcomeOnboardingProps {
  forceOpen?: boolean;
  forceView?: OnboardingView;
  onClose?: () => void;
}

export const WelcomeOnboarding = ({ 
  forceOpen = false, 
  forceView,
  onClose 
}: WelcomeOnboardingProps = {}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<OnboardingView>(forceView || 'initial');
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setLoading(false);
      if (forceView) {
        setView(forceView);
      }
    } else {
      checkOnboardingStatus();
    }
  }, [forceOpen, forceView]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const displayName = user.user_metadata?.display_name || 
                           user.email?.split("@")[0] || 
                           "Usuario";
        
        await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: displayName,
            avatar_url: null,
            onboarding_completed: false
          });
        
        setTimeout(() => {
          setOpen(true);
          analytics.trackEvent('onboarding_started');
        }, 500);
        return;
      }

      if (profile && !profile.onboarding_completed) {
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
    if (!forceOpen) {
      await markOnboardingCompleted();
    }
    analytics.trackEvent('onboarding_closed', { view, tutorialStep });
    onClose?.();
  };

  const handleViewTutorial = () => {
    setView('tutorial');
    setTutorialStep(0);
    analytics.trackEvent('onboarding_tutorial_started');
  };

  const handleNextTutorialStep = () => {
    if (tutorialStep < 2) {
      setTutorialStep(tutorialStep + 1);
      analytics.trackEvent('onboarding_tutorial_step', { step: tutorialStep + 1 });
    } else {
      setView('templates');
      analytics.trackEvent('onboarding_tutorial_completed');
    }
  };

  const handleSkipTutorial = () => {
    setView('templates');
    analytics.trackEvent('onboarding_tutorial_skipped', { step: tutorialStep });
  };

  const handleShowTemplates = () => {
    setView('templates');
    analytics.trackEvent('onboarding_templates_opened');
  };

  const handleSelectTemplate = async (templateType: string) => {
    if (!forceOpen) {
      await markOnboardingCompleted();
    }
    setOpen(false);

    const currentYear = new Date().getFullYear();
    const templates: Record<string, TemplateData> = {
      navidad: {
        name: `Compras Navideñas ${currentYear}`,
        description: "Coordina compras navideñas con amigos y familia",
        min_budget: "30",
        max_budget: "70",
        exchange_date: `${currentYear}-12-24`,
        notification_mode: "group",
        suggested_budget: "50",
      },
      cumpleaños: {
        name: "Cumpleaños",
        description: "Coordina compras para cumpleaños",
        min_budget: "20",
        max_budget: "50",
        exchange_date: "",
        notification_mode: "group",
        suggested_budget: "30",
      },
      oficina: {
        name: "Compras de Oficina",
        description: "Compras grupales entre compañeros de trabajo",
        min_budget: "15",
        max_budget: "40",
        exchange_date: "",
        notification_mode: "group",
        suggested_budget: "25",
      },
      otro: {
        name: "",
        description: "",
        min_budget: "",
        max_budget: "",
        exchange_date: "",
        notification_mode: "group",
        suggested_budget: "",
      },
    };

    const templateData = templates[templateType];
    
    analytics.trackEvent('onboarding_template_selected', { template: templateType });
    
    // Redirigir a la página de grupos con parámetros de plantilla
    navigate('/groups', { 
      state: { 
        templateData,
        openDialog: true 
      } 
    });

    // Llamar onClose si está definido (cuando se abre forzadamente)
    onClose?.();
  };

  const handleExploreWithoutCreating = async () => {
    setOpen(false);
    if (!forceOpen) {
      await markOnboardingCompleted();
    }
    analytics.trackEvent('onboarding_explore_without_creating');
    navigate('/');
    onClose?.();
  };

  if (loading) return null;

  // Renderizar contenido según la vista actual
  const renderContent = () => {
    if (view === 'initial') {
      return <InitialView onCreateExchange={handleShowTemplates} onViewTutorial={handleViewTutorial} />;
    }
    
    if (view === 'tutorial') {
      return (
        <TutorialView 
          step={tutorialStep} 
          onNext={handleNextTutorialStep} 
          onSkip={handleSkipTutorial} 
        />
      );
    }
    
    if (view === 'templates') {
      return (
        <TemplatesView 
          onSelectTemplate={handleSelectTemplate} 
          onExplore={handleExploreWithoutCreating} 
        />
      );
    }
  };

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

        {/* Dynamic Content */}
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

// ============= VISTA INICIAL =============
const InitialView = ({ 
  onCreateExchange, 
  onViewTutorial 
}: { 
  onCreateExchange: () => void; 
  onViewTutorial: () => void;
}) => {
  return (
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
          onClick={onCreateExchange}
          size="lg"
          className="w-full text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Gift className="w-5 h-5 mr-2" />
          Crear mi intercambio
        </Button>
        
        <Button
          onClick={onViewTutorial}
          variant="outline"
          size="lg"
          className="w-full text-base font-semibold hover:bg-accent transition-all duration-300"
        >
          Ver cómo funciona
        </Button>
      </div>
    </div>
  );
};

// ============= VISTA TUTORIAL =============
const TutorialView = ({ 
  step, 
  onNext, 
  onSkip 
}: { 
  step: number; 
  onNext: () => void; 
  onSkip: () => void;
}) => {
  const tutorialSteps = [
    {
      icon: <CheckCircle className="w-16 h-16 text-primary" />,
      title: "1. Crea tu intercambio",
      description: "Define la ocasión, fecha y presupuesto"
    },
    {
      icon: <Mail className="w-16 h-16 text-primary" />,
      title: "2. Invita participantes",
      description: "Tus amigos reciben email para unirse"
    },
    {
      icon: <Sparkles className="w-16 h-16 text-primary" />,
      title: "3. ¡Todos regalan mejor!",
      description: "Cada quien sabe exactamente qué regalar"
    }
  ];

  const currentStep = tutorialSteps[step];

  return (
    <div className="px-8 py-10 text-center">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-center items-center gap-2 mb-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary w-3 h-3' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Paso {step + 1} de 3
        </p>
      </div>

      {/* Icon */}
      <div className="mb-8 flex justify-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
          {currentStep.icon}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold mb-4 text-foreground animate-fade-in">
        {currentStep.title}
      </h2>

      {/* Description */}
      <p className="text-base text-muted-foreground mb-10 leading-relaxed animate-fade-in max-w-sm mx-auto">
        {currentStep.description}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full text-base font-semibold"
        >
          {step === 2 ? (
            <>
              <Gift className="w-5 h-5 mr-2" />
              Crear mi intercambio
            </>
          ) : (
            "Siguiente →"
          )}
        </Button>
        
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Saltar tutorial
        </button>
      </div>
    </div>
  );
};

// ============= VISTA PLANTILLAS =============
const TemplatesView = ({ 
  onSelectTemplate, 
  onExplore 
}: { 
  onSelectTemplate: (template: string) => void; 
  onExplore: () => void;
}) => {
  const templates = [
    {
      id: 'navidad',
      icon: <Gift className="w-10 h-10" />,
      title: 'Navidad',
      subtitle: 'Compras grupales',
      gradient: 'from-red-500/20 to-green-500/20'
    },
    {
      id: 'cumpleaños',
      icon: <PartyPopper className="w-10 h-10" />,
      title: 'Cumpleaños',
      subtitle: '',
      gradient: 'from-pink-500/20 to-purple-500/20'
    },
    {
      id: 'oficina',
      icon: <Briefcase className="w-10 h-10" />,
      title: 'Evento',
      subtitle: 'Oficina',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'otro',
      icon: <Calendar className="w-10 h-10" />,
      title: 'Otra',
      subtitle: 'ocasión',
      gradient: 'from-amber-500/20 to-orange-500/20'
    }
  ];

  return (
    <div className="px-8 py-10">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-8 text-center text-foreground">
        ¿Qué vas a celebrar?
      </h2>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`
              relative p-6 rounded-xl border-2 border-border
              bg-gradient-to-br ${template.gradient}
              hover:scale-105 hover:shadow-lg hover:border-primary/50
              transition-all duration-300
              flex flex-col items-center justify-center gap-2
              min-h-[140px]
            `}
          >
            <div className="text-primary">
              {template.icon}
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">
                {template.title}
              </div>
              {template.subtitle && (
                <div className="text-sm text-muted-foreground">
                  {template.subtitle}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Explore Link */}
      <div className="text-center">
        <button
          onClick={onExplore}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Explorar sin crear
        </button>
      </div>
    </div>
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
