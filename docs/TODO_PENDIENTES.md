# 📋 TODO - ASPECTOS PENDIENTES GiftApp MVP

**Fecha:** 2025-01-12  
**Proyecto:** GiftApp MVP v1.0.0  
**Status:** Post-FASE 4 - Aprobado para Staging  

---

## 🔴 CRÍTICO - P0 (BLOQUEADORES - Resolver AHORA)

### Bugs Críticos (1 item)

- [x] **P0-BUG-001**: ✅ Error UUID en Assignment.tsx (RESUELTO)
  - **Dónde**: `src/pages/Assignment.tsx` línea 62
  - **Problema**: `groupId` undefined causaba query con literal ":groupId"
  - **Acción**: Agregada validación de `groupId` antes de queries
  - **Impacto**: Previene error 400 al cargar asignaciones
  - **Tiempo**: 15 minutos
  - **Responsable**: Dev
  - **Status**: ✅ CORREGIDO

### Mejoras Implementadas (Post-Auditoría)

- [x] **P0-UX-001**: ✅ Opciones de compartir invitación (IMPLEMENTADO)
  - **Dónde**: `src/pages/Groups.tsx` - Código de invitación
  - **Acción**: Agregados botones para compartir por Email y SMS además de WhatsApp
  - **Funcionalidades**:
    - Email: Abre cliente de correo con asunto y cuerpo pre-formateados
    - SMS: Abre app de mensajes con texto pre-formateado (compatible iOS/Android)
    - WhatsApp: Mantiene funcionalidad existente
  - **Impacto**: Mejora UX al ofrecer múltiples canales de invitación
  - **Tiempo**: 20 minutos
  - **Responsable**: Dev
  - **Status**: ✅ IMPLEMENTADO
  - **Fecha**: 2025-01-12

---

## 🔴 CRÍTICO - P1 (Resolver antes de Producción Completa)

### Seguridad (3 items)

- [ ] **P1-SEC-001**: Habilitar Leaked Password Protection
  - **Dónde**: Lovable Cloud → Authentication → Settings
  - **Acción**: Activar "Leaked Password Protection" 
  - **Impacto**: Previene uso de contraseñas comprometidas
  - **Tiempo estimado**: 5 minutos
  - **Responsable**: Admin

- [ ] **P1-SEC-002**: Implementar Rate Limiting en Edge Functions
  - **Dónde**: 
    - `supabase/functions/suggest-gift/index.ts`
    - `supabase/functions/search-products/index.ts`
  - **Acción**: Agregar middleware de rate limiting (ej: 10 requests/minuto por IP)
  - **Impacto**: Previene abuso de API y ataques DDoS
  - **Tiempo estimado**: 2-3 horas
  - **Responsable**: Backend Dev

- [ ] **P1-SEC-003**: Configurar CORS Restrictivo
  - **Dónde**: Todas las Edge Functions (actualmente usan `'*'`)
  - **Acción**: Cambiar a dominio específico: `https://your-domain.com`
  - **Impacto**: Previene acceso no autorizado desde otros dominios
  - **Tiempo estimado**: 30 minutos
  - **Responsable**: Backend Dev

### Datos y Backup (1 item)

- [ ] **P1-DATA-001**: Testear Restauración de Backup
  - **Dónde**: Lovable Cloud (backups automáticos habilitados)
  - **Acción**: 
    1. Crear backup manual
    2. Intentar restaurar en staging
    3. Documentar procedimiento
  - **Impacto**: Asegurar recuperación ante desastres
  - **Tiempo estimado**: 1-2 horas
  - **Responsable**: DevOps

### Legal y Cumplimiento (2 items)

- [ ] **P1-LEGAL-001**: Implementar Flujo de Eliminación de Cuenta
  - **Dónde**: 
    - Nueva página: `src/pages/Settings.tsx`
    - Edge function: `supabase/functions/delete-user-account/index.ts`
  - **Acción**: 
    1. Crear formulario con confirmación doble
    2. Implementar edge function que elimine:
       - Datos de usuario (profiles, gift_lists, etc.)
       - Registros relacionados
       - Auth user (último paso)
    3. Enviar email de confirmación
  - **Impacto**: Requerido por GDPR/CCPA
  - **Tiempo estimado**: 4-6 horas
  - **Responsable**: Full Stack Dev

- [ ] **P1-LEGAL-002**: Implementar Exportación de Datos de Usuario
  - **Dónde**: 
    - `src/pages/Settings.tsx`
    - Edge function: `supabase/functions/export-user-data/index.ts`
  - **Acción**: 
    1. Crear endpoint que recopile todos los datos del usuario
    2. Generar archivo JSON/CSV descargable
    3. Incluir: perfil, listas, grupos, mensajes
  - **Impacto**: Derecho de portabilidad GDPR/CCPA
  - **Tiempo estimado**: 3-4 horas
  - **Responsable**: Backend Dev

### Performance y Monitoreo (2 items)

- [ ] **P1-PERF-002**: Medir Core Web Vitals
  - **Dónde**: Staging environment
  - **Herramientas**: 
    - Lighthouse (Chrome DevTools)
    - WebPageTest
    - PageSpeed Insights
  - **Acción**: 
    1. Medir LCP, FID, CLS en páginas principales
    2. Documentar baseline
    3. Crear plan de optimización si es necesario
  - **Objetivo**: LCP < 2.5s, FID < 100ms, CLS < 0.1
  - **Tiempo estimado**: 2 horas
  - **Responsable**: Frontend Dev

- [ ] **P1-PERF-003**: Configurar Monitoreo de Performance
  - **Dónde**: 
    - Sentry (ya configurado, falta DSN)
    - Analytics (opcional: Vercel Analytics, DataDog)
  - **Acción**: 
    1. Usuario agrega `VITE_SENTRY_DSN` a secrets
    2. Verificar que errores se reportan correctamente
    3. Configurar alertas para error rate > 5%
  - **Impacto**: Detectar problemas antes que usuarios
  - **Tiempo estimado**: 1 hora
  - **Responsable**: DevOps

### Documentación (1 item)

- [ ] **P1-QUAL-002**: Completar Documentación de Edge Functions
  - **Dónde**: `docs/EDGE_FUNCTIONS_API.md`
  - **Acción**: Para cada edge function documentar:
    - Endpoint URL
    - Método HTTP
    - Parámetros de entrada (body, query, headers)
    - Estructura de respuesta
    - Códigos de error
    - Ejemplos de uso (curl, JavaScript)
  - **Impacto**: Facilita debugging y mantenimiento
  - **Tiempo estimado**: 2-3 horas
  - **Responsable**: Backend Dev

---

## 🟡 IMPORTANTE - P2 (Próximo Sprint)

### Testing y Calidad (2 items)

- [ ] **P2-QUAL-001**: Aumentar Cobertura de Tests a 60%
  - **Dónde**: Toda la aplicación
  - **Status actual**: ~15% (8 tests básicos)
  - **Acción**: 
    1. Tests unitarios para hooks y utilidades
    2. Tests de integración para flujos críticos
    3. Tests E2E con Playwright/Cypress
  - **Prioridad**: Flujos de sorteo, assignments, mensajes anónimos
  - **Tiempo estimado**: 1-2 semanas
  - **Responsable**: QA + Dev Team

- [ ] **P2-QUAL-003**: Crear Tests E2E para Flujos Completos
  - **Dónde**: Nuevo directorio `e2e/`
  - **Herramienta sugerida**: Playwright o Cypress
  - **Flujos a testear**:
    1. Signup → Create Group → Invite Members → Draw → View Assignment
    2. Join Group → View Assignment → Send Anonymous Message
    3. Create Wishlist → Add Items → Share with Group
  - **Tiempo estimado**: 1 semana
  - **Responsable**: QA Lead

### UX y Accesibilidad (2 items)

- [ ] **P2-UX-001**: Testing con Lectores de Pantalla
  - **Dónde**: Toda la aplicación
  - **Herramientas**: NVDA (Windows), JAWS, VoiceOver (Mac/iOS)
  - **Acción**: 
    1. Testear navegación completa con teclado
    2. Verificar anuncios de screen reader
    3. Corregir elementos sin labels apropiados
  - **Tiempo estimado**: 4-6 horas
  - **Responsable**: UX/Accessibility Specialist

- [ ] **P2-UX-002**: Auditoría con Lighthouse/axe
  - **Dónde**: Todas las páginas principales
  - **Herramientas**: Lighthouse, axe DevTools
  - **Acción**: 
    1. Ejecutar auditorías automatizadas
    2. Corregir issues encontrados
    3. Documentar mejoras implementadas
  - **Objetivo**: Score de accesibilidad > 95
  - **Tiempo estimado**: 3-4 horas
  - **Responsable**: Frontend Dev

### Infraestructura (2 items)

- [ ] **P2-INFRA-001**: Testear Procedimiento de Rollback
  - **Dónde**: Staging environment
  - **Acción**: 
    1. Simular despliegue fallido
    2. Ejecutar rollback según `DEPLOYMENT_RUNBOOK.md`
    3. Verificar que aplicación vuelve a estado anterior
    4. Documentar tiempos y problemas encontrados
  - **Tiempo estimado**: 2 horas
  - **Responsable**: DevOps

- [ ] **P2-INFRA-002**: Implementar Feature Flags
  - **Dónde**: Nuevo sistema de feature flags
  - **Herramienta sugerida**: LaunchDarkly, Flagsmith, o custom
  - **Acción**: 
    1. Integrar librería de feature flags
    2. Implementar kill switch para features críticas
    3. Documentar uso
  - **Impacto**: Disable features sin redeploy
  - **Tiempo estimado**: 4-6 horas
  - **Responsable**: Full Stack Dev

### Documentación (2 items)

- [ ] **P2-DOC-001**: Crear Diagrama de Arquitectura
  - **Dónde**: `docs/ARCHITECTURE.md`
  - **Herramienta**: Mermaid, Draw.io, o Excalidraw
  - **Contenido**: 
    - Diagrama de componentes frontend
    - Diagrama de flujo de datos
    - Diagrama de base de datos (ERD)
    - Diagrama de edge functions
  - **Tiempo estimado**: 3-4 horas
  - **Responsable**: Tech Lead

- [ ] **P2-DOC-002**: Crear Guías de Usuario
  - **Dónde**: `docs/USER_GUIDES/`
  - **Guías necesarias**:
    1. "Cómo crear tu primer grupo"
    2. "Cómo hacer el sorteo"
    3. "Cómo ver tu asignación"
    4. "Cómo crear una lista de deseos"
    5. "Cómo enviar mensajes anónimos"
  - **Formato**: Markdown con screenshots
  - **Tiempo estimado**: 1 día
  - **Responsable**: Product Owner + Technical Writer

### Legal (1 item)

- [ ] **P2-LEGAL-003**: Implementar Cookie Consent Banner
  - **Dónde**: `src/components/CookieConsent.tsx`
  - **Requerido si**: Se usan cookies de tracking (Analytics, etc.)
  - **Acción**: 
    1. Agregar banner con opciones de aceptar/rechazar
    2. Guardar preferencia en localStorage
    3. Condicionar carga de scripts según preferencia
  - **Tiempo estimado**: 2-3 horas
  - **Responsable**: Frontend Dev

---

## 🟢 MEJORAS FUTURAS - P3 (Backlog)

### Features (4 items)

- [ ] **P3-FEAT-001**: Notificaciones Push
  - **Descripción**: Alertas cuando recibes mensaje anónimo o sorteo completado
  - **Tiempo estimado**: 1 semana

- [ ] **P3-FEAT-002**: Integración con Calendarios
  - **Descripción**: Agregar fecha de intercambio a Google Calendar, iCal
  - **Tiempo estimado**: 3-4 días

- [ ] **P3-FEAT-003**: Sugerencias de Regalo con IA
  - **Descripción**: Mejorar edge function `suggest-gift` con contexto de perfil
  - **Tiempo estimado**: 1 semana

- [ ] **P3-FEAT-004**: Temas y Personalización
  - **Descripción**: Permitir usuarios cambiar colores/temas del grupo
  - **Tiempo estimado**: 3-4 días

### UX (2 items)

- [ ] **P3-UX-003**: Animaciones y Microinteracciones
  - **Descripción**: Agregar animaciones suaves en transiciones
  - **Herramienta**: Framer Motion
  - **Tiempo estimado**: 1 semana

- [ ] **P3-UX-004**: Onboarding Interactivo
  - **Descripción**: Tour guiado para nuevos usuarios
  - **Status**: Ya existe componente `OnboardingTour.tsx`, mejorar
  - **Tiempo estimado**: 2-3 días

---

## 🔧 APIs Y SERVICIOS REQUERIDOS

### APIs Externas Actuales

1. **Supabase (Lovable Cloud)** ✅
   - Database (PostgreSQL)
   - Authentication
   - Storage (avatars bucket)
   - Edge Functions (10 funciones desplegadas)
   - **Status**: Configurado y funcional
   - **Secrets**: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

2. **Resend (Email)** ⚠️
   - Usado en: `send-welcome-email`, `send-password-reset`, `notify-anonymous-message`
   - **Status**: Código implementado
   - **Pendiente**: Verificar que emails se envíen correctamente en producción
   - **Secret**: RESEND_API_KEY

3. **Stripe (Pagos)** ⚠️
   - Usado en: `create-checkout-session`, `stripe-webhook`
   - **Status**: Código implementado
   - **Pendiente**: Plan de monetización en docs, no activado
   - **Secrets**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

4. **Amazon Product Advertising API** ⚠️
   - Usado en: `search-amazon-products`, `generate-affiliate-link`
   - **Status**: Código implementado
   - **Pendiente**: Usuarios deben agregar sus propias credenciales
   - **Tabla**: `amazon_credentials` (access_key, secret_key, associate_tag)

### APIs a Considerar (Futuro)

5. **Sentry (Error Monitoring)** 🔴 P1
   - **Status**: Código listo, falta configurar
   - **Pendiente**: Agregar `VITE_SENTRY_DSN`
   - **Ver**: `docs/SENTRY_CONFIGURATION.md`

6. **Google Analytics / Vercel Analytics** 🟡 P2
   - **Status**: Analytics básico implementado
   - **Pendiente**: Configurar `VITE_GA_MEASUREMENT_ID`

7. **Twilio / SendGrid (SMS/Email avanzado)** 🟢 P3
   - Para notificaciones push
   - Alternativa a Resend

8. **OpenAI / Anthropic (IA Avanzada)** 🟢 P3
   - Para sugerencias de regalo más contextuales
   - Actualmente: Lovable AI (gratuito)

---

## 📊 RESUMEN DE ESTADO

### Por Prioridad

| Prioridad | Total | Completados | Pendientes | % Completado |
|---|---|---|---|---|
| **P0 - Bloqueadores** | 1 | 1 | 0 | **100%** ✅ |
| **P1 - Altos** | 8 | 0 | 8 | **0%** 🔴 |
| **P2 - Medios** | 12 | 0 | 12 | **0%** 🟡 |
| **P3 - Bajos** | 6 | 0 | 6 | **0%** 🟢 |
| **TOTAL** | **27** | **1** | **26** | **4%** |

### Por Categoría

- **Seguridad**: 3 P1 pendientes
- **Legal/Cumplimiento**: 3 P1+P2 pendientes
- **Performance**: 2 P1 pendientes
- **Testing**: 2 P2 pendientes
- **Documentación**: 3 P1+P2 pendientes
- **UX/Accesibilidad**: 4 P2+P3 pendientes
- **Infraestructura**: 2 P2 pendientes
- **Features Nuevas**: 4 P3 backlog

---

## ⏱️ ESTIMACIONES DE TIEMPO

### Sprint Inmediato (Resolver P1)
- **Tiempo total estimado**: 15-20 horas
- **Timeline sugerido**: 2-3 días laborables
- **Equipo necesario**: 1 Full Stack Dev + 1 DevOps

### Próximo Sprint (P2)
- **Tiempo total estimado**: 2-3 semanas
- **Equipo necesario**: 2 Devs + 1 QA + 1 UX

### Backlog (P3)
- **Tiempo total estimado**: 1-2 meses
- **Planificar según prioridades de negocio

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. ✅ **Deploy a Staging** (HOY)
   - Ejecutar smoke tests en staging
   - Validar que todo funciona en ambiente real

2. 🔴 **Resolver P1 de Seguridad** (Días 1-3)
   - Leaked Password Protection (5 min)
   - Rate Limiting (2-3 hrs)
   - CORS (30 min)

3. 🔴 **Resolver P1 Legal** (Días 2-4)
   - Account Deletion (4-6 hrs)
   - Data Export (3-4 hrs)

4. 🔴 **Resolver P1 Performance** (Día 3)
   - Medir Core Web Vitals (2 hrs)
   - Configurar Sentry (1 hr)

5. ✅ **Segunda Validación FASE 4** (Día 4)
   - Verificar todos P1 resueltos
   - Re-ejecutar smoke tests
   - Aprobar para producción completa

6. 🚀 **Deploy a Producción** (Día 5)
   - Seguir `DEPLOYMENT_RUNBOOK.md`
   - Monitoreo intensivo 24-48hrs
   - Marketing y comunicación

---

## 📞 CONTACTOS Y RESPONSABLES

### Para Asignar

- **Tech Lead**: _________________
- **Backend Dev**: _________________
- **Frontend Dev**: _________________
- **DevOps**: _________________
- **QA Lead**: _________________
- **UX/Accessibility**: _________________
- **Product Owner**: _________________
- **Legal/Compliance**: _________________

---

**Última actualización**: 2025-01-12  
**Próxima revisión**: Después de resolver P1  
**Documento mantenido por**: Tech Lead

---

## 📝 NOTAS ADICIONALES

### Decisiones Técnicas Pendientes

1. **Feature Flags**: ¿Implementar sistema propio o usar servicio externo?
2. **Testing E2E**: ¿Playwright o Cypress?
3. **Monitoreo**: ¿Solo Sentry o agregar DataDog/New Relic?
4. **Rate Limiting**: ¿A nivel de edge function o usar Cloudflare?
5. **Email Provider**: ¿Continuar con Resend o migrar a SendGrid/SES?

### Riesgos Identificados

1. **GDPR Compliance**: Sin account deletion, no podemos lanzar en EU
2. **Performance**: Sin Core Web Vitals medidos, posible UX degradada
3. **Security**: CORS permisivo y sin rate limiting = vulnerable a ataques
4. **Monitoring**: Sin Sentry configurado, debugging en producción será difícil

---

**FIN TODO - MANTENER ACTUALIZADO** 📋✅
