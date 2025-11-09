import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Landing Page
    "hero.badge": "✨ The Modern Gift Exchange Platform",
    "hero.title": "Make Gift Giving",
    "hero.titleHighlight": "Magical Again",
    "hero.description": "Create wish lists, organize secret santa exchanges, and never forget what your loved ones want. Perfect for families, friends, and teams.",
    "hero.cta": "Get Started Free",
    "hero.demo": "View Demo",
    
    // Features
    "features.title": "Everything You Need",
    "features.subtitle": "Powerful features to make gift giving effortless",
    "features.lists.title": "Smart Wish Lists",
    "features.lists.description": "Create detailed lists with categories, colors, sizes, and links",
    "features.groups.title": "Group Exchange",
    "features.groups.description": "Organize secret santa with automatic matching and privacy",
    "features.events.title": "Multi-Event Support",
    "features.events.description": "Manage lists for birthdays, holidays, and custom occasions",
    "features.privacy.title": "Privacy First",
    "features.privacy.description": "Your assignments stay secret. Share only what you want",
    
    // CTA Section
    "cta.title": "Ready to Transform Gift Giving?",
    "cta.subtitle": "Join thousands who make gift exchanges fun and stress-free",
    "cta.button": "Create Your Free Account",
    
    // Auth Page
    "auth.welcome": "Welcome to GiftApp",
    "auth.tagline": "Create lists, organize exchanges, share joy",
    "auth.getStarted": "Get Started",
    "auth.description": "Sign in or create your account",
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.displayName": "Display Name",
    "auth.signingIn": "Signing in...",
    "auth.creatingAccount": "Creating account...",
    "auth.createAccount": "Create Account",
    "auth.accountCreated": "Account created! Welcome to GiftApp!",
    "auth.welcomeBack": "Welcome back!",
    "auth.signUpFailed": "Failed to sign up",
    "auth.signInFailed": "Failed to sign in",
    
    // Dashboard
    "dashboard.welcomeBack": "Welcome back!",
    "dashboard.signOut": "Sign Out",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.createList": "Create New List",
    "dashboard.joinGroup": "Join or Create Group",
    "dashboard.manageEvents": "Manage Events",
    "dashboard.overview": "Your Overview",
    "dashboard.myLists": "My Lists",
    "dashboard.myGroups": "My Groups",
    "dashboard.events": "Events",
    "dashboard.listsCreated": "Gift lists created",
    "dashboard.groupsJoined": "Groups joined",
    "dashboard.upcomingOccasions": "Upcoming occasions",
    "dashboard.gettingStarted": "Getting Started",
    "dashboard.gettingStartedDesc": "Complete these steps to make the most of GiftApp",
    "dashboard.step1": "Create your first gift list",
    "dashboard.step2": "Join or create a group",
    "dashboard.step3": "Invite friends to your group",
    "dashboard.step4": "Set up a secret santa exchange",
    "dashboard.signedOut": "Signed out successfully",
    "dashboard.signOutFailed": "Failed to sign out",
    "dashboard.loading": "Loading...",
  },
  es: {
    // Landing Page
    "hero.badge": "✨ La Plataforma Moderna de Intercambio de Regalos",
    "hero.title": "Haz que Regalar sea",
    "hero.titleHighlight": "Mágico Otra Vez",
    "hero.description": "Crea listas de deseos, organiza amigos secretos y nunca olvides lo que tus seres queridos desean. Perfecto para familias, amigos y equipos.",
    "hero.cta": "Comenzar Gratis",
    "hero.demo": "Ver Demo",
    
    // Features
    "features.title": "Todo lo que Necesitas",
    "features.subtitle": "Funciones poderosas para hacer que regalar sea fácil",
    "features.lists.title": "Listas Inteligentes",
    "features.lists.description": "Crea listas detalladas con categorías, colores, tallas y enlaces",
    "features.groups.title": "Intercambio Grupal",
    "features.groups.description": "Organiza amigo secreto con emparejamiento automático y privacidad",
    "features.events.title": "Múltiples Eventos",
    "features.events.description": "Gestiona listas para cumpleaños, festividades y ocasiones personalizadas",
    "features.privacy.title": "Privacidad Primero",
    "features.privacy.description": "Tus asignaciones permanecen secretas. Comparte solo lo que quieras",
    
    // CTA Section
    "cta.title": "¿Listo para Transformar tus Regalos?",
    "cta.subtitle": "Únete a miles que hacen intercambios divertidos y sin estrés",
    "cta.button": "Crea tu Cuenta Gratis",
    
    // Auth Page
    "auth.welcome": "Bienvenido a GiftApp",
    "auth.tagline": "Crea listas, organiza intercambios, comparte alegría",
    "auth.getStarted": "Comenzar",
    "auth.description": "Inicia sesión o crea tu cuenta",
    "auth.signIn": "Iniciar Sesión",
    "auth.signUp": "Registrarse",
    "auth.email": "Correo Electrónico",
    "auth.password": "Contraseña",
    "auth.displayName": "Nombre para Mostrar",
    "auth.signingIn": "Iniciando sesión...",
    "auth.creatingAccount": "Creando cuenta...",
    "auth.createAccount": "Crear Cuenta",
    "auth.accountCreated": "¡Cuenta creada! ¡Bienvenido a GiftApp!",
    "auth.welcomeBack": "¡Bienvenido de nuevo!",
    "auth.signUpFailed": "Error al registrarse",
    "auth.signInFailed": "Error al iniciar sesión",
    
    // Dashboard
    "dashboard.welcomeBack": "¡Bienvenido de nuevo!",
    "dashboard.signOut": "Cerrar Sesión",
    "dashboard.quickActions": "Acciones Rápidas",
    "dashboard.createList": "Crear Nueva Lista",
    "dashboard.joinGroup": "Unirse o Crear Grupo",
    "dashboard.manageEvents": "Gestionar Eventos",
    "dashboard.overview": "Tu Resumen",
    "dashboard.myLists": "Mis Listas",
    "dashboard.myGroups": "Mis Grupos",
    "dashboard.events": "Eventos",
    "dashboard.listsCreated": "Listas de regalos creadas",
    "dashboard.groupsJoined": "Grupos unidos",
    "dashboard.upcomingOccasions": "Ocasiones próximas",
    "dashboard.gettingStarted": "Comenzando",
    "dashboard.gettingStartedDesc": "Completa estos pasos para aprovechar al máximo GiftApp",
    "dashboard.step1": "Crea tu primera lista de regalos",
    "dashboard.step2": "Únete o crea un grupo",
    "dashboard.step3": "Invita amigos a tu grupo",
    "dashboard.step4": "Configura un intercambio de amigo secreto",
    "dashboard.signedOut": "Sesión cerrada exitosamente",
    "dashboard.signOutFailed": "Error al cerrar sesión",
    "dashboard.loading": "Cargando...",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "en" || saved === "es") ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};