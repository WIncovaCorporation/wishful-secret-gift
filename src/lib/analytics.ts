/**
 * Analytics Configuration and Helpers
 * Fix #05: Integrate Google Analytics 4 for user behavior tracking
 */

// Note: In production, you'll need to:
// 1. Add Google Analytics script to index.html
// 2. Add your GA4 Measurement ID to environment variables
// 3. Implement proper cookie consent management

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

/**
 * Initialize Google Analytics
 */
export const initAnalytics = () => {
  if (!GA_MEASUREMENT_ID || import.meta.env.DEV) {
    console.log('Analytics ready (configure VITE_GA_MEASUREMENT_ID to enable)');
    return;
  }

  // Load GA4 script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  window.gtag('js', new Date().toISOString());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually
    anonymize_ip: true, // GDPR compliance
  });
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag) {
    console.log('Page view:', path, title);
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (!window.gtag) {
    console.log('Event:', eventName, parameters);
    return;
  }

  window.gtag('event', eventName, parameters);
};

/**
 * Track user action
 */
export const trackUserAction = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  trackEvent(action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

/**
 * Track conversion
 */
export const trackConversion = (
  conversionName: string,
  value?: number,
  currency: string = 'USD'
) => {
  trackEvent(conversionName, {
    value: value,
    currency: currency,
  });
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!window.gtag) {
    console.log('User properties:', properties);
    return;
  }

  window.gtag('set', 'user_properties', properties);
};

/**
 * Track timing
 */
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  trackEvent('timing_complete', {
    event_category: category,
    name: variable,
    value: value,
    event_label: label,
  });
};

// Pre-defined event tracking helpers

export const analytics = {
  // Authentication events
  signUp: () => trackEvent('sign_up', { method: 'email' }),
  login: () => trackEvent('login', { method: 'email' }),
  logout: () => trackEvent('logout'),

  // Feature usage
  createList: () => trackUserAction('create_list', 'lists'),
  viewList: (listId: string) => trackUserAction('view_list', 'lists', listId),
  shareList: (listId: string) => trackUserAction('share_list', 'lists', listId),
  
  createGroup: () => trackUserAction('create_group', 'groups'),
  joinGroup: (groupId: string) => trackUserAction('join_group', 'groups', groupId),
  
  createEvent: () => trackUserAction('create_event', 'events'),
  viewEvent: (eventId: string) => trackUserAction('view_event', 'events', eventId),
  
  // AI features
  useAISuggestion: () => trackUserAction('use_ai_suggestion', 'ai'),
  searchProducts: (query: string) => trackUserAction('search_products', 'search', query),
  
  // Engagement
  trackEvent: (eventName: string, params?: Record<string, any>) => trackEvent(eventName, params),
  viewDashboard: () => trackPageView('/dashboard', 'Dashboard'),
};
