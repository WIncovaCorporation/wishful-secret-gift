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
    
    // Groups & Secret Santa
    "groups.howItWorks": "How the Secret Santa Draw Works",
    "groups.howItWorksDesc": "100% transparent and fair algorithm",
    "groups.algorithm.title": "🎲 100% Random Algorithm",
    "groups.algorithm.desc": "We use the Fisher-Yates algorithm, the gold standard for random shuffling. Each member has equal probability of being assigned to any other member.",
    "groups.privacy.title": "🔒 Absolute Privacy",
    "groups.privacy.desc": "Only you can see who you should give a gift to. Not even the group creator can see other people's assignments. Protected by Row Level Security.",
    "groups.fairness.title": "⚖️ Guaranteed Fairness",
    "groups.fairness.desc": "The system validates that no one is assigned to themselves and that everyone gives and receives exactly one gift. If validation fails, the draw is automatically redone.",
    "groups.security.title": "🛡️ Bank-Level Security",
    "groups.security.desc": "Assignments are encrypted in the database with access policies that ensure only the gift giver can see their assignment.",
    "groups.confidence.title": "Frequently Asked Questions",
    "groups.confidence.privacy": "Can anyone see my assignment?",
    "groups.confidence.privacyAnswer": "No. Only you can see who you should give a gift to. It's technically impossible for others to access your assignment.",
    "groups.confidence.redraw": "What if I want to redo the draw?",
    "groups.confidence.redrawAnswer": "Only the group creator can redo the draw. If they do, all previous assignments will be deleted and a new completely random draw will be performed.",
    "groups.confidence.memberLeaves": "What happens if someone leaves the group?",
    "groups.confidence.memberLeavesAnswer": "If someone leaves after the draw, the group creator will need to redo the draw to ensure everyone has a valid assignment.",
    "groups.confirmDraw.title": "Confirm Secret Santa Draw",
    "groups.confirmDraw.description": "This action will randomly assign who gives a gift to whom. Once done, each member will be able to see their assignment privately.",
    "groups.confirmDraw.warning": "⚠️ Important: Make sure all members have joined before drawing. You can redo the draw later if needed, but previous assignments will be deleted.",
    "groups.confirmDraw.membersCount": "Members participating",
    "groups.confirmDraw.minMembers": "Minimum 3 members required",
    "groups.confirmDraw.budget": "Budget",
    "groups.confirmDraw.date": "Exchange date",
    "groups.confirmDraw.confirm": "Perform Draw",
    "groups.confirmDraw.cancel": "Cancel",
    "groups.viewAssignment": "View My Assignment",
    "groups.drawComplete": "Draw completed! Each member can now view their assignment.",
    "groups.adminView": "Admin: View All",
    "groups.adminViewDesc": "View all assignments (creator only)",
    
    // Assignment Page
    "assignment.title": "Your Secret Santa Assignment",
    "assignment.subtitle": "This information is private and only visible to you",
    "assignment.youGiftTo": "You give a gift to",
    "assignment.notFound": "Assignment not found",
    "assignment.notFoundDesc": "No assignment found for this group. The draw may not have been performed yet.",
    "assignment.budget": "Recommended budget",
    "assignment.exchangeDate": "Exchange date",
    "assignment.wishList": "Wish List",
    "assignment.noWishList": "This person hasn't created a wish list yet",
    "assignment.viewFullList": "View full list",
    "assignment.confidentiality": "🤫 Confidentiality",
    "assignment.confidentialityDesc": "Remember: this is a secret! Don't reveal to anyone who your assigned person is. The magic of Secret Santa is in the surprise.",
    "assignment.backToGroup": "Back to Group",
    "assignment.loading": "Loading your assignment...",
    
    // Anonymous Chat
    "chat.title": "Anonymous Questions",
    "chat.description": "Ask questions without revealing your identity",
    "chat.placeholder": "Ask about size, color, preferences...",
    "chat.send": "Send",
    "chat.noMessages": "No messages yet",
    "chat.you": "You",
    "chat.secretSanta": "Your Secret Santa",
    "chat.typing": "Typing...",
    "chat.howItWorks": "How does it work?",
    "chat.howItWorksDesc": "Send anonymous messages to the person you're giving a gift to. They'll receive your questions but won't know who's asking. Perfect for clarifying sizes, colors, or preferences!",
    "chat.receivedMessages": "Messages from your Secret Santa",
    "chat.receivedMessagesDesc": "Someone wants to know more about your preferences!",
    
    // Dashboard Assignments
    "dashboard.myAssignments": "My Secret Santa Assignments",
    "dashboard.myAssignmentsDesc": "Groups where you have an active assignment",
    "dashboard.viewAssignment": "View Assignment",
    "dashboard.noAssignments": "No active assignments yet",
    "dashboard.newMessage": "New message",
    
    // AI Assistant
    "aiAssistant.title": "Gift Assistant",
    "aiAssistant.subtitle": "Powered by OpenAI GPT-4",
    "aiAssistant.initialMessage": "Hey! 👋 Ready to find the perfect gift? Tell me who it's for!",
    "aiAssistant.placeholder": "Tell me about the gift you're looking for...",
    "aiAssistant.giftBot": "GiftBot"
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
    
    // Grupos e Intercambio de Regalos
    "groups.howItWorks": "Cómo Funciona el Sorteo de Amigo Secreto",
    "groups.howItWorksDesc": "Algoritmo 100% transparente y justo",
    "groups.algorithm.title": "🎲 Algoritmo 100% Aleatorio",
    "groups.algorithm.desc": "Utilizamos el algoritmo Fisher-Yates, el estándar de oro para barajar aleatoriamente. Cada miembro tiene igual probabilidad de ser asignado a cualquier otro miembro.",
    "groups.privacy.title": "🔒 Privacidad Absoluta",
    "groups.privacy.desc": "Solo tú puedes ver a quién debes regalar. Ni siquiera el creador del grupo puede ver las asignaciones de otras personas. Protegido por Row Level Security.",
    "groups.fairness.title": "⚖️ Justicia Garantizada",
    "groups.fairness.desc": "El sistema valida que nadie se regale a sí mismo y que todos den y reciban exactamente un regalo. Si la validación falla, el sorteo se rehace automáticamente.",
    "groups.security.title": "🛡️ Seguridad de Nivel Bancario",
    "groups.security.desc": "Las asignaciones están cifradas en la base de datos con políticas de acceso que aseguran que solo el regalador puede ver su asignación.",
    "groups.confidence.title": "Preguntas Frecuentes sobre Confianza",
    "groups.confidence.privacy": "¿Alguien puede ver mi asignación?",
    "groups.confidence.privacyAnswer": "No. Solo tú puedes ver a quién debes regalar. Es técnicamente imposible que otros accedan a tu asignación.",
    "groups.confidence.redraw": "¿Qué pasa si quiero volver a hacer el sorteo?",
    "groups.confidence.redrawAnswer": "Solo el creador del grupo puede volver a hacer el sorteo. Si lo hace, todas las asignaciones anteriores se borrarán y se realizará un nuevo sorteo completamente aleatorio.",
    "groups.confidence.memberLeaves": "¿Qué pasa si alguien sale del grupo?",
    "groups.confidence.memberLeavesAnswer": "Si alguien sale después del sorteo, el creador del grupo deberá volver a hacer el sorteo para asegurar que todos tengan una asignación válida.",
    "groups.confirmDraw.title": "Confirmar Sorteo de Amigo Secreto",
    "groups.confirmDraw.description": "Esta acción asignará aleatoriamente quién le regala a quién. Una vez hecho, cada miembro podrá ver su asignación de forma privada.",
    "groups.confirmDraw.warning": "⚠️ Importante: Asegúrate de que todos los miembros se hayan unido antes de realizar el sorteo. Puedes volver a hacerlo después si es necesario, pero las asignaciones anteriores se borrarán.",
    "groups.confirmDraw.membersCount": "Miembros participantes",
    "groups.confirmDraw.minMembers": "Mínimo 3 miembros requeridos",
    "groups.confirmDraw.budget": "Presupuesto",
    "groups.confirmDraw.date": "Fecha de intercambio",
    "groups.confirmDraw.confirm": "Realizar Sorteo",
    "groups.confirmDraw.cancel": "Cancelar",
    "groups.viewAssignment": "Ver Mi Asignación",
    "groups.drawComplete": "¡Sorteo completado! Cada miembro puede ver ahora su asignación.",
    "groups.adminView": "Admin: Ver Todas",
    "groups.adminViewDesc": "Ver todas las asignaciones (solo creador)",
    
    // Página de Asignación
    "assignment.title": "Tu Asignación de Amigo Secreto",
    "assignment.subtitle": "Esta información es privada y solo visible para ti",
    "assignment.youGiftTo": "Tú le regalas a",
    "assignment.notFound": "Asignación no encontrada",
    "assignment.notFoundDesc": "No se encontró asignación para este grupo. Es posible que el sorteo aún no se haya realizado.",
    "assignment.budget": "Presupuesto recomendado",
    "assignment.exchangeDate": "Fecha de intercambio",
    "assignment.wishList": "Lista de Deseos",
    "assignment.noWishList": "Esta persona aún no ha creado una lista de deseos",
    "assignment.viewFullList": "Ver lista completa",
    "assignment.confidentiality": "🤫 Confidencialidad",
    "assignment.confidentialityDesc": "Recuerda: ¡esto es un secreto! No reveles a nadie quién es tu persona asignada. La magia del Amigo Secreto está en la sorpresa.",
    "assignment.backToGroup": "Volver al Grupo",
    "assignment.loading": "Cargando tu asignación...",
    
    // Chat Anónimo
    "chat.title": "Preguntas Anónimas",
    "chat.description": "Haz preguntas sin revelar tu identidad",
    "chat.placeholder": "Pregunta sobre talla, color, preferencias...",
    "chat.send": "Enviar",
    "chat.noMessages": "Aún no hay mensajes",
    "chat.you": "Tú",
    "chat.secretSanta": "Tu Amigo Secreto",
    "chat.typing": "Escribiendo...",
    "chat.howItWorks": "¿Cómo funciona?",
    "chat.howItWorksDesc": "Envía mensajes anónimos a la persona a quien le vas a regalar. Recibirá tus preguntas pero no sabrá quién pregunta. ¡Perfecto para aclarar tallas, colores o preferencias!",
    "chat.receivedMessages": "Mensajes de tu Amigo Secreto",
    "chat.receivedMessagesDesc": "¡Alguien quiere saber más sobre tus preferencias!",
    
    // Asignaciones Dashboard
    "dashboard.myAssignments": "Mis Asignaciones de Amigo Secreto",
    "dashboard.myAssignmentsDesc": "Grupos donde tienes una asignación activa",
    "dashboard.viewAssignment": "Ver Asignación",
    "dashboard.noAssignments": "Aún no tienes asignaciones activas",
    "dashboard.newMessage": "Mensaje nuevo",
    
    // AI Assistant
    "aiAssistant.title": "Asistente de Regalos",
    "aiAssistant.subtitle": "Powered by OpenAI GPT-4",
    "aiAssistant.initialMessage": "¡Hola! 👋 ¿Listo para encontrar el regalo perfecto? ¡Cuéntame para quién es!",
    "aiAssistant.placeholder": "Cuéntame sobre el regalo que buscas...",
    "aiAssistant.giftBot": "GiftBot"
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    if (saved === "en" || saved === "es") return saved;
    
    // Auto-detect browser language
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('es') ? 'es' : 'en';
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