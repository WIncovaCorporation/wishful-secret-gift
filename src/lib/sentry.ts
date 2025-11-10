/**
 * Sentry Error Monitoring Configuration
 * Fix #04: Integrate Sentry for error monitoring and tracking
 * Corrección #08 (P0-2): Sentry activado para producción
 */

import * as Sentry from "@sentry/react";

export const initSentry = () => {
  // Only initialize in production or when VITE_SENTRY_DSN is configured
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Environment
      environment: import.meta.env.MODE,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || "1.0.0",
      
      // Filter out non-error events in development
      beforeSend(event, hint) {
        // Log in development but still send to Sentry if DSN is configured
        if (import.meta.env.DEV) {
          console.error('Sentry Event:', event, hint);
        }
        return event;
      },
    });
    
    console.log(`✅ Sentry initialized (${import.meta.env.MODE} mode)`);
  } else {
    console.warn('⚠️ Sentry DSN not configured. Set VITE_SENTRY_DSN to enable error monitoring.');
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error captured:', error, context);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}] ${message}`);
  }
};

export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(user);
  } else {
    console.log('User context set:', user);
  }
};

export const clearUserContext = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  } else {
    console.log('User context cleared');
  }
};
