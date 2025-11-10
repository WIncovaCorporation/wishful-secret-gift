/**
 * Onboarding Tour Component
 * Fix #06: Implement interactive onboarding tour for new users
 */

import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useLanguage } from '@/contexts/LanguageContext';
import { analytics } from '@/lib/analytics';

const TOUR_COMPLETED_KEY = 'giftapp_tour_completed';

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run = true, onComplete }) => {
  const { t } = useLanguage();
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Check if tour has been completed before
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted && run) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setRunTour(true), 500);
    }
  }, [run]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">
            {t('welcome')} 🎁
          </h2>
          <p>
            {t('tourWelcomeMessage') || 'Bienvenido a GiftApp. Te mostraremos las funciones principales en un tour rápido.'}
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="nav-lists"]',
      content: t('tourListsStep') || 'Aquí puedes crear y gestionar tus listas de regalos. Organiza ideas por ocasión, persona o categoría.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="nav-groups"]',
      content: t('tourGroupsStep') || 'Crea grupos con amigos y familia para compartir listas y coordinar regalos entre varias personas.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="nav-events"]',
      content: t('tourEventsStep') || 'Planifica eventos especiales como cumpleaños, bodas o navidades. Asocia listas y grupos a cada evento.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="create-list"]',
      content: t('tourCreateListStep') || 'Haz clic aquí para crear tu primera lista. Puedes añadir productos, descripción y mantenerla privada o compartida.',
      placement: 'left',
    },
    {
      target: '[data-tour="ai-suggestions"]',
      content: t('tourAIStep') || 'Usa nuestras sugerencias con IA para encontrar el regalo perfecto basado en intereses y ocasión.',
      placement: 'left',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data;

    // Tour completed or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      
      if (status === STATUS.FINISHED) {
        analytics.trackEvent('tutorial_complete');
      }
      
      onComplete?.();
    }

    // Track step changes
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      const { trackEvent } = analytics;
      trackEvent('tour_step_completed', {
        step: data.index,
      });
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: t('back') || 'Atrás',
        close: t('close') || 'Cerrar',
        last: t('finish') || 'Finalizar',
        next: t('next') || 'Siguiente',
        skip: t('skip') || 'Saltar',
      }}
    />
  );
};

// Hook to restart tour
export const useRestartTour = () => {
  const restartTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    window.location.reload();
  };

  return restartTour;
};
