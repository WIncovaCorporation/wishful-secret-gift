# 🏗️ Arquitectura del Sistema WINCOVA

## Stack Tecnológico

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Routing:** React Router v6
- **State:** React Query (TanStack)
- **Forms:** React Hook Form + Zod
- **Build:** Vite
- **Testing:** Vitest + Testing Library

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Functions:** Supabase Edge Functions (Deno)
- **Realtime:** Supabase Realtime

### DevOps
- **CI/CD:** GitHub Actions
- **Hosting:** Lovable Cloud
- **Monitoring:** Sentry
- **Analytics:** Custom analytics (src/lib/analytics.ts)

---

## Estructura del Proyecto

```
wincova-giftapp/
├── .github/
│   └── workflows/
│       └── wincova-audit.yml          # Dual Agent CI/CD
├── docs/
│   ├── WINCOVA_AI_AUDITOR.md          # Security Bot DNA
│   ├── ULTRA_UX_BOT_DNA.md            # UX Bot DNA
│   ├── DUAL_AGENT_SYSTEM.md           # Sistema híbrido
│   └── SYSTEM_ARCHITECTURE.md         # Este archivo
├── src/
│   ├── components/
│   │   ├── ui/                        # shadcn components
│   │   ├── ErrorBoundary.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── ...
│   ├── contexts/
│   │   ├── AnalyticsContext.tsx
│   │   └── LanguageContext.tsx
│   ├── hooks/
│   │   ├── useUserRole.ts
│   │   ├── useSubscription.ts
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Supabase client
│   │       └── types.ts               # DB types (auto-gen)
│   ├── lib/
│   │   ├── analytics.ts               # Analytics helpers
│   │   ├── sentry.ts                  # Error tracking
│   │   └── utils.ts                   # Utility functions
│   ├── pages/
│   │   ├── AdminAuditLogs.tsx         # Audit logs dashboard
│   │   ├── AdminCorrections.tsx       # AI corrections dashboard
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── App.tsx                        # Main app component
│   ├── index.css                      # Global styles + design tokens
│   └── main.tsx                       # Entry point
├── supabase/
│   ├── functions/
│   │   ├── github-audit-webhook/      # Webhook receiver
│   │   ├── ai-shopping-assistant/
│   │   └── ...
│   ├── migrations/                    # DB migrations
│   └── config.toml                    # Supabase config
├── tailwind.config.ts                 # Tailwind config
├── vite.config.ts                     # Vite config
└── vitest.config.ts                   # Vitest config
```

---

## Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario visita app                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  2. App.tsx verifica sesión (Supabase Auth)                 │
│     - Si autenticado → Dashboard                             │
│     - Si no → /auth (login/signup)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  3. Usuario hace login/signup                                │
│     - Supabase Auth maneja tokens (JWT)                      │
│     - Auto-confirm email (dev mode)                          │
│     - Profile creation trigger                               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  4. Session establecida                                      │
│     - JWT en localStorage                                    │
│     - Auto-refresh token                                     │
│     - User ID disponible: auth.uid()                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  5. RLS policies aplican                                     │
│     - Solo ve sus propios datos                              │
│     - Roles verificados: free_user, admin, etc.              │
└──────────────────────────────────────────────────────────────┘
```

---

## Base de Datos

### Tablas Principales

#### Usuarios y Perfiles
- `profiles` - Información adicional del usuario
- `user_roles` - Sistema de roles (free_user, admin, etc.)
- `user_subscriptions` - Suscripciones activas

#### Grupos y Gift Exchange
- `groups` - Grupos de intercambio
- `group_members` - Miembros de grupos
- `gift_exchanges` - Asignaciones de intercambio
- `gift_lists` - Listas de deseos
- `gift_items` - Items en listas

#### Eventos
- `events` - Eventos (navidad, cumpleaños, etc.)

#### Productos y Marketplace
- `affiliate_products` - Productos del marketplace
- `affiliate_clicks` - Tracking de clicks
- `amazon_credentials` - Credenciales de Amazon Associates
- `gift_card_inventory` - Inventario de gift cards

#### Auditoría (Dual Agent System)
- `github_audit_logs` - Logs de auditoría de GitHub
- `ai_corrections` - Correcciones sugeridas por AI

#### Sistema
- `rate_limits` - Rate limiting
- `usage_tracking` - Tracking de uso por usuario
- `subscription_plans` - Planes de suscripción

### RLS Policies

**Principio:** Row Level Security activado en TODAS las tablas

Ejemplo (`gift_lists`):
```sql
-- Users can view own gift lists
CREATE POLICY "Users can view own gift lists"
  ON gift_lists FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create own gift lists
CREATE POLICY "Users can create own gift lists"
  ON gift_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Sistema de Roles

### Enum `app_role`
```sql
CREATE TYPE app_role AS ENUM (
  'free_user',
  'premium_user',
  'corporate_manager',
  'admin'
);
```

### Verificación de Roles
```typescript
// Frontend (useUserRole hook)
const { isAdmin, isLoading } = useUserRole();

// Backend (Database Function)
has_role(auth.uid(), 'admin'::app_role)
```

### Permisos por Rol
```
free_user:
  - 1 grupo activo
  - 10 participantes max
  - 3 AI suggestions/mes

premium_user:
  - 10 grupos activos
  - 50 participantes max
  - 50 AI suggestions/mes

corporate_manager:
  - Unlimited grupos
  - 200 participantes max
  - 200 AI suggestions/mes

admin:
  - Full access
  - Ver audit logs
  - Gestionar correcciones AI
  - Gestionar usuarios
```

---

## Edge Functions

### github-audit-webhook
**Purpose:** Recibe webhook de GitHub Actions con análisis dual  
**Trigger:** GitHub Workflow completion  
**Input:** 
```json
{
  "workflow_run": {
    "security_analysis": { ... },
    "ux_analysis": { ... }
  }
}
```
**Output:** Inserta en `github_audit_logs` y `ai_corrections`

### ai-shopping-assistant
**Purpose:** Asistente de compras con AI  
**Model:** Lovable AI (Gemini 2.5 Flash)  
**Input:** User query + context  
**Output:** Product suggestions + reasoning

### search-amazon-products
**Purpose:** Búsqueda en Amazon Product Advertising API  
**Auth:** Amazon credentials (user-specific)  
**Output:** Products con affiliate links

### generate-affiliate-link
**Purpose:** Genera affiliate links rastreables  
**Output:** Link + tracking en `affiliate_clicks`

---

## Auditoría Dual (Core Innovation)

### WINCOVA Security Auditor v2.0
**Always Runs:** Yes  
**Focus:** Security, Architecture, Performance  
**Model:** OpenAI GPT-5 (temp: 0.2)  

**Detecta:**
- Vulnerabilidades OWASP
- Credenciales hardcodeadas
- Memory leaks
- N+1 queries
- RLS bypasses

### Ultra UX Bot v2.0
**Always Runs:** No (solo frontend changes)  
**Focus:** UX Emocional, ROI, Multi-Platform  
**Model:** OpenAI GPT-5 (temp: 0.3)  

**Detecta:**
- UX blockers (botones rotos)
- Touch targets < 44px
- Loading states faltantes
- Revenue at risk
- WCAG violations

### Combined Risk Calculation
```typescript
const totalCritical = 
  securitySummary.critical_count + 
  uxSummary.critical_count;

if (totalCritical > 0) return 'HIGH';
if (totalImportant > 2) return 'MEDIUM';
return 'LOW';
```

---

## Monitoreo y Observabilidad

### Sentry (Error Tracking)
```typescript
// src/lib/sentry.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
});
```

### Analytics Custom
```typescript
// src/lib/analytics.ts
export const trackEvent = (eventName: string, properties?: object) => {
  // Custom analytics implementation
  // Could integrate: Mixpanel, Amplitude, GA4
};
```

### Supabase Realtime
```typescript
// Listen to changes in real-time
const channel = supabase
  .channel('messages')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'messages' 
  }, (payload) => {
    console.log('Change received!', payload);
  })
  .subscribe();
```

---

## Performance Optimization

### Code Splitting
```typescript
// Lazy loading de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminAuditLogs = lazy(() => import('./pages/AdminAuditLogs'));
```

### Image Optimization
```typescript
// Lazy loading de imágenes
<img 
  src={product.image} 
  alt={product.name}
  loading="lazy"
  className="aspect-square object-cover"
/>
```

### React Query Caching
```typescript
// src/hooks/useUserRole.ts
const { data: roles } = useQuery({
  queryKey: ['user-roles', user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .rpc('get_user_roles', { _user_id: user.id });
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 min cache
  enabled: !!user
});
```

---

## Security Best Practices

### Environment Variables
```typescript
// NEVER hardcode secrets
❌ const API_KEY = "sk-proj-abc123";

✅ const API_KEY = import.meta.env.VITE_API_KEY;
```

### RLS Always On
```sql
-- Enable RLS on ALL tables
ALTER TABLE gift_lists ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
CREATE POLICY "Users see own lists only"
  ON gift_lists FOR ALL
  USING (auth.uid() = user_id);
```

### Input Validation
```typescript
// Zod schemas for all forms
const productSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  url: z.string().url()
});
```

### Rate Limiting
```sql
-- Rate limits table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now()
);
```

---

## Deployment Pipeline

### GitHub Actions Workflow
```
Push/PR → main branch
  ↓
Code Quality (ESLint, TypeScript)
  ↓
Testing (Vitest + Coverage)
  ↓
Security Scan (npm audit)
  ↓
AI Security Analysis (WINCOVA Bot)
  ↓
AI UX Analysis (Ultra UX Bot) [if frontend]
  ↓
Build Verification
  ↓
Report & Webhook → Supabase
  ↓
Admin Dashboard (visible)
```

### Lovable Cloud Deployment
```
Developer updates code in Lovable
  ↓
Changes auto-pushed to GitHub (bidirectional sync)
  ↓
GitHub Actions runs audit
  ↓
If approved → Auto-deploy to Lovable Cloud
  ↓
Production live (staging.lovable.app)
```

---

## Testing Strategy

### Unit Tests
```typescript
// src/components/__tests__/LanguageSelector.test.tsx
describe('LanguageSelector', () => {
  it('renders all language options', () => {
    render(<LanguageSelector />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
// src/pages/__tests__/Auth.test.tsx
describe('Auth Flow', () => {
  it('allows user to sign up', async () => {
    // Test full signup flow
  });
});
```

### E2E Tests
```typescript
// Critical paths:
// - Homepage → Signup → Dashboard → Create Group → Invite → Assign
// - Homepage → Login → Lists → Add Item → Share
// - Homepage → Marketplace → Browse → Click Affiliate Link
```

---

## Escalabilidad

### Database Indexing
```sql
-- Indexes críticos
CREATE INDEX idx_gift_lists_user_id ON gift_lists(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_affiliate_clicks_product_id ON affiliate_clicks(product_id);
```

### Connection Pooling
```typescript
// Supabase auto-maneja connection pooling
// Default: 15 connections por cliente
// Configurable en Project Settings
```

### Edge Function Optimization
```typescript
// Deno edge functions auto-scale
// No configuration needed
// Cold start: ~50-100ms
```

---

## Costos y Límites

### Lovable Cloud (Free Tier)
- 500MB Database
- 1GB Storage
- 500K Edge Function invocations/month
- Unlimited bandwidth

### OpenAI API (Dual Agents)
- Security Bot: ~$0.02 per audit
- UX Bot: ~$0.03 per audit (solo frontend)
- Promedio: ~$1-2 por día para proyecto activo

### Monitoring
- Sentry: Free plan (5K events/month)
- Analytics: Custom (free, self-hosted)

---

## Contactos y Soporte

**Project Owner:** WINCOVA AI Team  
**GitHub:** github.com/wincova/giftapp  
**Docs:** docs.lovable.dev  
**Support:** support@lovable.dev  

**Admin Dashboard:**
- Audit Logs: `/admin/audit-logs`
- AI Corrections: `/admin/corrections`
- Roles Test: `/roles-test`

---

**Última actualización:** 2025-11-15  
**Versión:** 2.0 (Dual Agent System)
