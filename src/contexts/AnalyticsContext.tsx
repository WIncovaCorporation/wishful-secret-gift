/**
 * Analytics Context Provider
 * Fix #05: Integrate Google Analytics 4 for user behavior tracking
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from '@/lib/analytics';

interface AnalyticsContextType {
  initialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [initialized, setInitialized] = React.useState(false);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
    setInitialized(true);
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (initialized) {
      trackPageView(location.pathname);
    }
  }, [location, initialized]);

  return (
    <AnalyticsContext.Provider value={{ initialized }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
