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
    "auth.name": "Name",
    "auth.displayName": "Display Name",
    "auth.signingIn": "Signing in...",
    "auth.creatingAccount": "Creating account...",
    "auth.createAccount": "Create Account",
    "auth.accountCreated": "Account created successfully! Welcome.",
    "auth.welcomeBack": "Welcome back!",
    "auth.signUpFailed": "Failed to sign up",
    "auth.signInFailed": "Failed to sign in",
    "auth.emailAlreadyExists": "This email is already registered. Please sign in.",
    "auth.invalidCredentials": "Invalid email or password. Please check your credentials.",
    "auth.forgotPassword": "Forgot your password?",
    "auth.resetPassword": "Reset Password",
    "auth.resetPasswordDesc": "Enter your email and we'll send you a link to reset your password",
    "auth.sendResetLink": "Send Link",
    "auth.cancel": "Cancel",
    "auth.sending": "Sending...",
    "auth.resetEmailSent": "We've sent you an email to reset your password",
    "auth.resetEmailFailed": "Failed to send recovery email",
    "auth.passwordMinLength": "Minimum 6 characters",
    "auth.nameRequired": "Name is required",
    "auth.emailPlaceholder": "you@example.com",
    "auth.namePlaceholder": "Your name",
    "auth.passwordPlaceholder": "••••••••",
    
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
    "dashboard.upcomingEvents": "Upcoming Events",
    "dashboard.listsDescription": "Gift lists created",
    "dashboard.groupsDescription": "Groups joined",
    "dashboard.eventsDescription": "Upcoming occasions",
    "dashboard.planEvent": "Plan an Event",
    
    // Onboarding Tour
    "welcome": "Welcome",
    "back": "Back",
    "close": "Close",
    "finish": "Finish",
    "next": "Next",
    "skip": "Skip",
    "tourWelcome": "Welcome to GiftApp! 🎁",
    "tourWelcomeMessage": "Organize, share, and coordinate your gifts intelligently.",
    "tourWelcomeSubtitle": "We'll show you in 4 steps how everything works.",
    "tourActionsStep": "These are the 3 main functions of GiftApp:",
    "tourActionsLists": "📝 Lists: Organize gift ideas",
    "tourActionsGroups": "👥 Groups: Share and coordinate with friends/family",
    "tourActionsEvents": "🎉 Events: Plan special occasions",
    "tourCreateListStep": "Start here! Create your first gift list. Add products manually or search for ideas with AI. Decide if it's private or shared.",
    "tourStatsStep": "Here you'll see your progress: lists created, groups you participate in, and upcoming events. Your entire gift universe at a glance!",
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
    "auth.name": "Nombre",
    "auth.displayName": "Nombre para Mostrar",
    "auth.signingIn": "Iniciando sesión...",
    "auth.creatingAccount": "Creando cuenta...",
    "auth.createAccount": "Crear Cuenta",
    "auth.accountCreated": "¡Cuenta creada exitosamente! Bienvenido.",
    "auth.welcomeBack": "¡Bienvenido de vuelta!",
    "auth.signUpFailed": "Error al registrarse",
    "auth.signInFailed": "Error al iniciar sesión",
    "auth.emailAlreadyExists": "Este correo ya está registrado. Por favor, inicia sesión.",
    "auth.invalidCredentials": "Correo o contraseña incorrectos. Por favor, verifica tus datos.",
    "auth.forgotPassword": "¿Olvidaste tu contraseña?",
    "auth.resetPassword": "Recuperar Contraseña",
    "auth.resetPasswordDesc": "Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña",
    "auth.sendResetLink": "Enviar Enlace",
    "auth.cancel": "Cancelar",
    "auth.sending": "Enviando...",
    "auth.resetEmailSent": "Te hemos enviado un correo para restablecer tu contraseña",
    "auth.resetEmailFailed": "Error al enviar el correo de recuperación",
    "auth.passwordMinLength": "Mínimo 6 caracteres",
    "auth.nameRequired": "El nombre es requerido",
    "auth.emailPlaceholder": "tu@ejemplo.com",
    "auth.namePlaceholder": "Tu nombre",
    "auth.passwordPlaceholder": "••••••••",
    
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
    "dashboard.upcomingEvents": "Eventos Próximos",
    "dashboard.listsDescription": "Listas de regalos creadas",
    "dashboard.groupsDescription": "Grupos unidos",
    "dashboard.eventsDescription": "Ocasiones próximas",
    "dashboard.planEvent": "Planificar Evento",
    
    // Tour de Bienvenida
    "welcome": "Bienvenido",
    "back": "Atrás",
    "close": "Cerrar",
    "finish": "Finalizar",
    "next": "Siguiente",
    "skip": "Saltar",
    "tourWelcome": "¡Bienvenido a GiftApp! 🎁",
    "tourWelcomeMessage": "Organiza, comparte y coordina tus regalos de forma inteligente.",
    "tourWelcomeSubtitle": "Te mostraremos en 4 pasos cómo funciona todo.",
    "tourActionsStep": "Estas son las 3 funciones principales de GiftApp:",
    "tourActionsLists": "📝 Listas: Organiza ideas de regalos",
    "tourActionsGroups": "👥 Grupos: Comparte y coordina con amigos/familia",
    "tourActionsEvents": "🎉 Eventos: Planifica ocasiones especiales",
    "tourCreateListStep": "¡Empieza aquí! Crea tu primera lista de regalos. Puedes añadir productos manualmente o buscar ideas con IA. Decide si es privada o compartida.",
    "tourStatsStep": "Aquí verás tu progreso: listas creadas, grupos donde participas y eventos próximos. ¡Todo tu universo de regalos en un vistazo!",
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