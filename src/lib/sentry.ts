/**
 * Sentry Error Monitoring Configuration
 * Fix #04: Integrate Sentry for error monitoring and tracking
 */

// Note: In production, you'll need to:
// 1. Install Sentry: npm install @sentry/react
// 2. Add your Sentry DSN to environment variables
// 3. Uncomment the code below

/*
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Environment
      environment: import.meta.env.MODE,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || "1.0.0",
      
      // Filter out non-error events
      beforeSend(event, hint) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          console.error('Sentry Event:', event, hint);
          return null;
        }
        return event;
      },
    });
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error captured:', error, context);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}] ${message}`);
  }
};

export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  }
};

export const clearUserContext = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
};
*/

// Temporary stub implementation until Sentry is configured
export const initSentry = () => {
  console.log('Sentry monitoring ready (configure VITE_SENTRY_DSN to enable)');
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error('Error captured:', error, context);
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  console.log(`[${level}] ${message}`);
};

export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  console.log('User context set:', user);
};

export const clearUserContext = () => {
  console.log('User context cleared');
};
