# 🚀 GIFTAPP - ROADMAP DE IMPLEMENTACIÓN DE MONETIZACIÓN

**Versión:** 1.0  
**Fecha de Creación:** 2025-01-11  
**Objetivo:** Implementar arquitectura completa de monetización (Freemium + Marketplace + Corporate)  
**Timeline Estimado:** 8-12 semanas  
**Owner:** Product Lead + Engineering Lead

---

## 📋 ÍNDICE

1. [Fase 0: Preparación y Fundamentos](#fase-0)
2. [Fase 1: Sistema de Suscripciones (Freemium + Stripe)](#fase-1)
3. [Fase 2: Marketplace y Afiliados](#fase-2)
4. [Fase 3: Paquetes Corporativos y Estacionales](#fase-3)
5. [Fase 4: Analytics y Optimización](#fase-4)
6. [Fase 5: Testing y Lanzamiento](#fase-5)
7. [Anexos](#anexos)

---

## <a name="fase-0"></a>🔧 FASE 0: PREPARACIÓN Y FUNDAMENTOS
**Duración:** 1-2 semanas  
**Estado:** 🟡 Pendiente  
**Responsable:** Backend Lead + Security Engineer

### 0.1 Infraestructura de Roles y Permisos

**Objetivo:** Implementar sistema de roles seguro y escalable que soporte todos los modelos de monetización.

#### Tareas Base de Datos

**T0.1 - Crear Enum de Roles** (15 min)
```sql
-- Crear tipo enum para roles de aplicación
CREATE TYPE public.app_role AS ENUM (
  'free_user',
  'premium_user',
  'corporate_manager',
  'admin'
);
```

**T0.2 - Crear Tabla user_roles** (30 min)
```sql
-- Tabla para gestionar roles de usuarios
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'free_user',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = sin expiración
  created_by UUID REFERENCES auth.users(id), -- quién asignó el rol
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
```

**T0.3 - Crear Security Definer Function** (30 min)
```sql
-- Función segura para verificar roles (evita recursión de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Función para obtener roles activos de un usuario
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role app_role)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND (expires_at IS NULL OR expires_at > NOW());
$$;
```

**T0.4 - RLS Policies para user_roles** (30 min)
```sql
-- Usuarios pueden ver sus propios roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Solo admins pueden asignar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
```

**T0.5 - Migración de Usuarios Existentes** (1 hora)
```sql
-- Asignar rol 'free_user' a todos los usuarios existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'free_user'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Crear trigger para auto-asignar 'free_user' a nuevos usuarios
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();
```

#### Verificación y Testing

**T0.6 - Testing de Roles** (1 hora)
- [ ] Crear usuario test y verificar auto-asignación de 'free_user'
- [ ] Testear función `has_role()` con diferentes roles
- [ ] Testear función `get_user_roles()`
- [ ] Verificar RLS policies funcionando correctamente
- [ ] Intentar escalar privilegios (debe fallar)

**Criterio de Éxito:**
- ✅ Todos los usuarios tienen al menos un rol
- ✅ Funciones `has_role()` y `get_user_roles()` funcionan
- ✅ RLS policies bloquean acceso no autorizado
- ✅ Tests pasando

---

### 0.2 Stripe Integration Setup

**Objetivo:** Configurar Stripe para procesar pagos de suscripciones.

**T0.7 - Crear Cuenta Stripe** (30 min)
- [ ] Registrarse en https://stripe.com
- [ ] Activar cuenta (verificación de identidad puede tardar)
- [ ] Configurar información de negocio
- [ ] Obtener API keys (test + production)
  - Publishable Key: `pk_test_...`
  - Secret Key: `sk_test_...`

**T0.8 - Agregar Secrets a Supabase** (15 min)
- [ ] Ir a Supabase Dashboard > Project Settings > Edge Functions > Secrets
- [ ] Agregar `STRIPE_SECRET_KEY` (valor: `sk_test_...`)
- [ ] Agregar `STRIPE_PUBLISHABLE_KEY` (valor: `pk_test_...`)
- [ ] Agregar `STRIPE_WEBHOOK_SECRET` (se obtendrá después)

**T0.9 - Instalar Dependencia Stripe** (15 min)
```bash
# En proyecto frontend
npm install stripe @stripe/stripe-js

# Verificar instalación
npm list stripe
```

**T0.10 - Configurar Webhook Endpoint** (30 min)
- [ ] Stripe Dashboard > Developers > Webhooks
- [ ] Agregar endpoint: `https://[TU-PROYECTO].supabase.co/functions/v1/stripe-webhook`
- [ ] Seleccionar eventos:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copiar Webhook Secret (`whsec_...`)
- [ ] Actualizar secret `STRIPE_WEBHOOK_SECRET` en Supabase

**Criterio de Éxito:**
- ✅ Cuenta Stripe activa (test mode)
- ✅ API keys agregados a Supabase
- ✅ Webhook endpoint configurado
- ✅ Dependencias instaladas

---

### 0.3 UI/UX Base Components

**Objetivo:** Crear componentes reutilizables para el sistema de monetización.

**T0.11 - Componente FeatureGate** (2 horas)

```typescript
// src/components/FeatureGate.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: 'unlimited_groups' | 'ai_suggestions' | 'premium_lists' | 'corporate_features';
  requiredRole: 'premium_user' | 'corporate_manager';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, requiredRole, children, fallback }: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase.rpc('get_user_roles', { _user_id: user.id });
    const hasRole = roles?.some((r: any) => r.role === requiredRole || r.role === 'admin');
    setHasAccess(hasRole || false);
    setLoading(false);
  };

  if (loading) return <div>Cargando...</div>;

  if (!hasAccess) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Función Premium</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Esta función requiere una suscripción Premium
        </p>
        <Button onClick={() => navigate('/pricing')}>
          Ver Planes
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
```

**T0.12 - Componente UpgradePrompt** (1 hora)

```typescript
// src/components/UpgradePrompt.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  onDismiss?: () => void;
}

export function UpgradePrompt({ title, description, feature, onDismiss }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={() => navigate('/pricing')} className="flex-1">
          Actualizar a Premium
        </Button>
        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss}>
            Después
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

**T0.13 - Design Tokens para Planes** (30 min)

```css
/* src/index.css - Agregar al final */

/* Plan badges y colores */
:root {
  --plan-free: 210 100% 50%;
  --plan-premium: 280 100% 60%;
  --plan-corporate: 25 100% 50%;
}

.plan-badge-free {
  background: hsl(var(--plan-free) / 0.1);
  color: hsl(var(--plan-free));
  border: 1px solid hsl(var(--plan-free) / 0.3);
}

.plan-badge-premium {
  background: hsl(var(--plan-premium) / 0.1);
  color: hsl(var(--plan-premium));
  border: 1px solid hsl(var(--plan-premium) / 0.3);
}

.plan-badge-corporate {
  background: hsl(var(--plan-corporate) / 0.1);
  color: hsl(var(--plan-corporate));
  border: 1px solid hsl(var(--plan-corporate) / 0.3);
}
```

**Criterio de Éxito:**
- ✅ Componente `FeatureGate` funcional
- ✅ Componente `UpgradePrompt` funcional
- ✅ Design tokens aplicados
- ✅ Componentes testeados visualmente

---

**CHECKLIST FASE 0:**
- [ ] Enum `app_role` creado
- [ ] Tabla `user_roles` creada con RLS
- [ ] Funciones `has_role()` y `get_user_roles()` funcionando
- [ ] Todos los usuarios tienen rol `free_user`
- [ ] Cuenta Stripe configurada (test mode)
- [ ] Secrets de Stripe en Supabase
- [ ] Webhook endpoint configurado
- [ ] Componentes `FeatureGate` y `UpgradePrompt` creados
- [ ] Design tokens aplicados
- [ ] Tests de roles pasando

**Tiempo Total Fase 0:** 10-14 horas  
**Blocker para Fase 1:** ❌ NO CONTINUAR hasta completar esta fase

---

## <a name="fase-1"></a>💳 FASE 1: SISTEMA DE SUSCRIPCIONES (FREEMIUM + STRIPE)
**Duración:** 3-4 semanas  
**Estado:** 🔴 Bloqueado (requiere Fase 0)  
**Prioridad:** 🔥 CRÍTICA (Revenue Stream Principal)

### 1.1 Database Schema - Subscriptions

**T1.1 - Tabla subscription_plans** (30 min)

```sql
-- Planes de suscripción disponibles
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'Free', 'Premium Individual', 'Premium Business'
  display_name TEXT NOT NULL,
  description TEXT,
  stripe_price_id_monthly TEXT, -- NULL para Free
  stripe_price_id_annual TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  features JSONB NOT NULL DEFAULT '{}', -- { max_groups: 3, max_participants: 10, ai_suggestions_per_month: 0 }
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO public.subscription_plans (name, display_name, price_monthly, price_annual, features) VALUES
('free', 'Plan Gratuito', 0, 0, '{"max_groups": 3, "max_participants_per_group": 10, "max_wishlists": 1, "ai_suggestions_per_month": 0, "can_remove_branding": false, "priority_support": false}'),
('premium_individual', 'Premium Individual', 4.99, 49.99, '{"max_groups": 999, "max_participants_per_group": 50, "max_wishlists": 5, "ai_suggestions_per_month": 10, "can_remove_branding": true, "priority_support": false}'),
('premium_business', 'Premium Business', 19.99, 199.99, '{"max_groups": 999, "max_participants_per_group": 9999, "max_wishlists": 999, "ai_suggestions_per_month": 999, "can_remove_branding": true, "priority_support": true, "custom_branding": true}');

-- RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver los planes
CREATE POLICY "Plans are publicly viewable"
ON public.subscription_plans
FOR SELECT
USING (is_active = TRUE);
```

**T1.2 - Tabla user_subscriptions** (45 min)

```sql
-- Suscripciones activas de usuarios
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  
  -- Stripe data
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  
  -- Billing period
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: usuario solo puede tener 1 suscripción activa
  UNIQUE(user_id, status) WHERE status IN ('active', 'trialing')
);

-- Índices
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuarios ven solo su suscripción
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Solo backend puede modificar (via edge functions)
-- No crear políticas INSERT/UPDATE/DELETE (se manejan desde edge functions con service role)

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

**T1.3 - Tabla usage_tracking** (45 min)

```sql
-- Tracking de uso para feature gating
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contadores
  groups_count INTEGER DEFAULT 0,
  participants_total INTEGER DEFAULT 0,
  wishlists_count INTEGER DEFAULT 0,
  ai_suggestions_used INTEGER DEFAULT 0,
  
  -- Período de tracking (se resetea mensualmente)
  period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  
  -- Metadata
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Índice
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);

-- RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
ON public.usage_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- Función para inicializar tracking de nuevo usuario
CREATE OR REPLACE FUNCTION public.init_usage_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_init_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.init_usage_tracking();

-- Función para resetear contadores mensualmente (llamar desde cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_tracking
  SET 
    ai_suggestions_used = 0,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '1 month',
    last_reset_at = NOW()
  WHERE period_end < NOW();
END;
$$;
```

**Criterio de Éxito Sección 1.1:**
- ✅ 3 tablas creadas con RLS
- ✅ Datos de planes insertados
- ✅ Triggers funcionando
- ✅ Índices creados

---

### 1.2 Stripe Products Setup

**T1.4 - Crear Productos en Stripe Dashboard** (1 hora)

**Pasos manuales:**
1. Ir a Stripe Dashboard > Products
2. Crear producto "Premium Individual"
   - Precio mensual: $4.99 USD
   - Precio anual: $49.99 USD (crear como precio separado)
   - Recurring billing
3. Crear producto "Premium Business"
   - Precio mensual: $19.99 USD
   - Precio anual: $199.99 USD
4. Copiar `price_id` de cada precio (ej: `price_1ABC...`)
5. Actualizar `subscription_plans`:

```sql
UPDATE public.subscription_plans
SET stripe_price_id_monthly = 'price_1ABC...',
    stripe_price_id_annual = 'price_1DEF...'
WHERE name = 'premium_individual';

UPDATE public.subscription_plans
SET stripe_price_id_monthly = 'price_1GHI...',
    stripe_price_id_annual = 'price_1JKL...'
WHERE name = 'premium_business';
```

**Criterio de Éxito:**
- ✅ 2 productos en Stripe con 4 precios totales
- ✅ `price_id` guardados en base de datos
- ✅ Billing configurado como recurrente

---

### 1.3 Backend - Edge Functions

**T1.5 - Edge Function: create-checkout-session** (3 horas)

```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  plan_id: string;
  billing_cycle: 'monthly' | 'annual';
  success_url?: string;
  cancel_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan_id, billing_cycle, success_url, cancel_url }: CheckoutRequest = await req.json();

    // Obtener usuario autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // TODO: Validar JWT y obtener user_id
    const user_id = 'USER_ID_FROM_JWT'; // Implementar

    // Obtener plan de base de datos
    // TODO: Query a subscription_plans con plan_id

    const price_id = billing_cycle === 'monthly' 
      ? 'stripe_price_id_monthly' 
      : 'stripe_price_id_annual';

    // Verificar si usuario ya tiene customer_id en Stripe
    // TODO: Query a user_subscriptions

    let customer_id = 'EXISTING_CUSTOMER_ID'; // Si existe

    // Si no existe, crear customer
    if (!customer_id) {
      const customer = await stripe.customers.create({
        metadata: { user_id },
      });
      customer_id = customer.id;
    }

    // Crear checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      line_items: [{
        price: price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: success_url || `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/pricing`,
      metadata: {
        user_id,
        plan_id,
        billing_cycle,
      },
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**T1.6 - Edge Function: stripe-webhook-handler** (4 horas)

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook error', { status: 400 });
  }

  console.log('Received event:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: 
      // 1. Obtener user_id de metadata
      // 2. Obtener subscription de Stripe
      // 3. INSERT en user_subscriptions
      // 4. UPDATE user_roles: agregar 'premium_user' o 'corporate_manager'
      // 5. Enviar email de bienvenida (Resend)
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO:
      // 1. UPDATE user_subscriptions con nuevo status
      // 2. Si canceled: UPDATE user_roles: quitar rol premium
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO:
      // 1. UPDATE user_subscriptions: status = 'canceled'
      // 2. UPDATE user_roles: quitar rol premium, asignar 'free_user'
      // 3. Enviar email de cancelación
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // TODO:
      // 1. UPDATE user_subscriptions: status = 'past_due'
      // 2. Enviar email de pago fallido
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

**T1.7 - Edge Function: cancel-subscription** (2 horas)

```typescript
// supabase/functions/cancel-subscription/index.ts
// Implementación similar...
```

**T1.8 - Edge Function: get-subscription-status** (2 horas)

```typescript
// supabase/functions/get-subscription-status/index.ts
// Retorna plan actual + features + usage
```

**Criterio de Éxito Sección 1.3:**
- ✅ 4 edge functions desplegadas
- ✅ Webhooks procesando eventos correctamente
- ✅ Suscripciones creándose en base de datos
- ✅ Roles actualizándose automáticamente

---

### 1.4 Feature Gating Logic

**T1.9 - Funciones de Validación en Base de Datos** (3 horas)

```sql
-- Verificar si usuario puede crear grupo
CREATE OR REPLACE FUNCTION public.can_create_group(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan JSONB;
  current_groups INTEGER;
  max_groups INTEGER;
BEGIN
  -- Obtener plan del usuario
  SELECT sp.features INTO user_plan
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Si no tiene suscripción, usar plan Free
  IF user_plan IS NULL THEN
    SELECT features INTO user_plan
    FROM public.subscription_plans
    WHERE name = 'free';
  END IF;

  -- Obtener límite de grupos
  max_groups := (user_plan->>'max_groups')::INTEGER;

  -- Contar grupos actuales del usuario
  SELECT COUNT(*) INTO current_groups
  FROM public.groups
  WHERE created_by = _user_id;

  RETURN current_groups < max_groups;
END;
$$;

-- Verificar si grupo puede agregar más participantes
CREATE OR REPLACE FUNCTION public.can_add_participant(_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_id UUID;
  user_plan JSONB;
  current_participants INTEGER;
  max_participants INTEGER;
BEGIN
  -- Obtener creador del grupo
  SELECT created_by INTO creator_id
  FROM public.groups
  WHERE id = _group_id;

  -- Obtener plan del creador
  SELECT sp.features INTO user_plan
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = creator_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF user_plan IS NULL THEN
    SELECT features INTO user_plan
    FROM public.subscription_plans
    WHERE name = 'free';
  END IF;

  max_participants := (user_plan->>'max_participants_per_group')::INTEGER;

  SELECT COUNT(*) INTO current_participants
  FROM public.group_members
  WHERE group_id = _group_id;

  RETURN current_participants < max_participants;
END;
$$;

-- Similar para AI suggestions...
CREATE OR REPLACE FUNCTION public.can_use_ai(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
-- Implementación similar
$$;
```

**T1.10 - Integrar Validaciones en Aplicación** (4 horas)

Actualizar todas las operaciones CRUD para validar antes de ejecutar:

```typescript
// src/pages/Groups.tsx - Ejemplo
const handleCreateGroup = async () => {
  // Verificar si puede crear grupo
  const { data: canCreate, error } = await supabase.rpc('can_create_group', {
    _user_id: user.id
  });

  if (!canCreate) {
    // Mostrar UpgradePrompt
    setShowUpgradePrompt(true);
    return;
  }

  // Proceder con creación...
};
```

**Criterio de Éxito Sección 1.4:**
- ✅ Funciones de validación creadas
- ✅ Integradas en todas las operaciones CRUD
- ✅ UpgradePrompts mostrándose correctamente
- ✅ Tests de feature gating pasando

---

### 1.5 Frontend - Pricing & Checkout

**T1.11 - Página /pricing** (6 horas)

```typescript
// src/pages/Pricing.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: { monthly: 0, annual: 0 },
      description: 'Perfecto para probar',
      features: [
        'Hasta 3 grupos',
        'Máx. 10 participantes por grupo',
        '1 lista de deseos',
        'Mensajería anónima',
      ],
      cta: 'Empezar Gratis',
      highlighted: false,
    },
    {
      id: 'premium_individual',
      name: 'Premium Individual',
      price: { monthly: 4.99, annual: 49.99 },
      description: 'Para usuarios activos',
      features: [
        'Grupos ilimitados',
        'Hasta 50 participantes',
        '5 listas de deseos',
        '10 sugerencias IA/mes',
        'Sin marca de agua',
        'Historial completo',
      ],
      cta: 'Elegir Premium',
      highlighted: true,
    },
    {
      id: 'premium_business',
      name: 'Premium Business',
      price: { monthly: 19.99, annual: 199.99 },
      description: 'Para equipos y empresas',
      features: [
        'Todo lo de Premium',
        'Participantes ilimitados',
        'Listas ilimitadas',
        'IA ilimitado',
        'Branding personalizado',
        'Soporte prioritario',
        'Integración HR',
      ],
      cta: 'Elegir Business',
      highlighted: false,
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    window.location.href = data.checkout_url;
  };

  const savingsPercentage = Math.round(
    ((1 - plans[1].price.annual / (plans[1].price.monthly * 12)) * 100)
  );

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Elige tu plan perfecto</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Comienza gratis. Actualiza cuando lo necesites.
        </p>

        {/* Toggle Monthly/Annual */}
        <div className="flex items-center justify-center gap-4">
          <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
            Mensual
          </span>
          <Switch
            checked={billingCycle === 'annual'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
          />
          <span className={billingCycle === 'annual' ? 'font-semibold' : 'text-muted-foreground'}>
            Anual
            <span className="ml-2 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
              Ahorra {savingsPercentage}%
            </span>
          </span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}
          >
            {plan.highlighted && (
              <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
                Más Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.highlighted && <Sparkles className="w-5 h-5 text-primary" />}
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${plan.price[billingCycle]}
                </span>
                {plan.price[billingCycle] > 0 && (
                  <span className="text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full mb-6"
                variant={plan.highlighted ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.cta}
              </Button>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**T1.12 - Página /subscription** (4 horas)

Página para gestionar suscripción actual (ver plan, facturación, cancelar).

**T1.13 - Página /subscription/success** (2 horas)

Página de confirmación post-checkout.

**Criterio de Éxito Sección 1.5:**
- ✅ Página /pricing funcional
- ✅ Toggle monthly/annual funcionando
- ✅ Redirección a Stripe Checkout exitosa
- ✅ Página /subscription mostrando datos correctos
- ✅ Responsive en móvil

---

### 1.6 In-App Upgrade Prompts

**T1.14 - Implementar Nudges en Dashboard** (2 horas)

```typescript
// src/pages/Dashboard.tsx - Agregar banner superior
{hasRole('free_user') && (
  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-semibold">Actualiza a Premium</h3>
          <p className="text-sm text-muted-foreground">
            Desbloquea grupos ilimitados y sugerencias con IA
          </p>
        </div>
      </div>
      <Button onClick={() => navigate('/pricing')}>
        Ver Planes
      </Button>
    </div>
  </div>
)}
```

**T1.15 - Modals de Límite Alcanzado** (3 horas)

Cuando usuario intenta crear 4to grupo (en Free):

```typescript
{showLimitModal && (
  <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Has alcanzado el límite de grupos</DialogTitle>
        <DialogDescription>
          El Plan Gratuito permite hasta 3 grupos. Actualiza a Premium para crear grupos ilimitados.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="bg-primary/10 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Premium Individual - $4.99/mes</h4>
          <ul className="space-y-1 text-sm">
            <li>✓ Grupos ilimitados</li>
            <li>✓ Hasta 50 participantes por grupo</li>
            <li>✓ 10 sugerencias IA/mes</li>
          </ul>
        </div>
        <Button className="w-full" onClick={() => navigate('/pricing')}>
          Actualizar Ahora
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}
```

**Criterio de Éxito Sección 1.6:**
- ✅ Banner de upgrade visible para Free users
- ✅ Modals de límite funcionando
- ✅ CTAs llevando a /pricing
- ✅ Tests de conversión en marcha

---

### 1.7 Email Notifications (Resend)

**T1.16 - Edge Function: send-subscription-email** (3 horas)

```typescript
// supabase/functions/send-subscription-email/index.ts
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export async function sendWelcomeEmail(userEmail: string, planName: string) {
  await resend.emails.send({
    from: 'GiftApp <noreply@giftapp.com>',
    to: [userEmail],
    subject: '¡Bienvenido a Premium! 🎉',
    html: `
      <h1>¡Gracias por actualizar a ${planName}!</h1>
      <p>Ahora tienes acceso a:</p>
      <ul>
        <li>Grupos ilimitados</li>
        <li>Sugerencias con IA</li>
        <li>Y mucho más...</li>
      </ul>
      <p><a href="https://giftapp.com/dashboard">Ir al Dashboard</a></p>
    `,
  });
}

// Similar para: renewalReminder, paymentFailed, subscriptionCanceled, winbackEmail
```

**T1.17 - Integrar Emails en Webhook Handler** (1 hora)

Llamar funciones de email desde `stripe-webhook-handler`.

**Criterio de Éxito Sección 1.7:**
- ✅ 5 tipos de emails implementados
- ✅ Emails enviándose en momentos correctos
- ✅ Templates con buen diseño
- ✅ Unsubscribe link incluido

---

**CHECKLIST FASE 1:**
- [ ] 3 tablas de suscripciones creadas
- [ ] Productos en Stripe configurados
- [ ] 4 edge functions funcionando
- [ ] Webhooks procesando eventos
- [ ] Feature gating activo
- [ ] Página /pricing publicada
- [ ] Upgrade prompts funcionando
- [ ] Emails de suscripción enviándose
- [ ] Tests E2E de checkout pasando

**Tiempo Total Fase 1:** 40-50 horas  
**Criterio GO a Fase 2:** ✅ Al menos 1 pago test completado exitosamente

---

## <a name="fase-2"></a>🛒 FASE 2: MARKETPLACE Y AFILIADOS
**Duración:** 2-3 semanas  
**Estado:** 🔴 Bloqueado (requiere Fase 1)  
**Prioridad:** 🔥 ALTA (Revenue Secundario + Value Add)

### 2.1 Database Schema - Affiliates

**T2.1 - Tabla affiliate_products** (45 min)

```sql
CREATE TABLE public.affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'electronics', 'toys', 'books', 'fashion', 'home'
  
  -- Pricing
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Media
  image_url TEXT,
  product_url TEXT,
  
  -- Affiliate info
  affiliate_network TEXT NOT NULL, -- 'amazon', 'ebay', 'aliexpress', 'direct'
  affiliate_link TEXT NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 0.04, -- 4%
  
  -- Metadata
  rating NUMERIC(3,2), -- 0.00 - 5.00
  reviews_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_affiliate_products_category ON public.affiliate_products(category);
CREATE INDEX idx_affiliate_products_network ON public.affiliate_products(affiliate_network);
CREATE INDEX idx_affiliate_products_active ON public.affiliate_products(is_active) WHERE is_active = TRUE;

-- Full-text search
CREATE INDEX idx_affiliate_products_search ON public.affiliate_products 
USING GIN (to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- RLS
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver productos activos
CREATE POLICY "Active products are viewable by everyone"
ON public.affiliate_products
FOR SELECT
USING (is_active = TRUE);
```

**T2.2 - Tabla affiliate_clicks** (30 min)

```sql
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.affiliate_products(id),
  
  -- Tracking
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Conversion tracking (actualizado via webhook de affiliate network)
  converted BOOLEAN DEFAULT FALSE,
  conversion_date TIMESTAMP WITH TIME ZONE,
  commission_earned NUMERIC(10,2) DEFAULT 0,
  order_value NUMERIC(10,2)
);

-- Índices
CREATE INDEX idx_affiliate_clicks_user ON public.affiliate_clicks(user_id);
CREATE INDEX idx_affiliate_clicks_product ON public.affiliate_clicks(product_id);
CREATE INDEX idx_affiliate_clicks_date ON public.affiliate_clicks(clicked_at);
CREATE INDEX idx_affiliate_clicks_converted ON public.affiliate_clicks(converted);

-- RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propios clicks
CREATE POLICY "Users can view own clicks"
ON public.affiliate_clicks
FOR SELECT
USING (auth.uid() = user_id);

-- Admins pueden ver todos
CREATE POLICY "Admins can view all clicks"
ON public.affiliate_clicks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
```

**T2.3 - Tabla gift_card_inventory** (45 min)

```sql
CREATE TABLE public.gift_card_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Card info
  retailer TEXT NOT NULL, -- 'Amazon', 'Spotify', 'Netflix', 'Steam'
  denomination NUMERIC(10,2) NOT NULL, -- 10, 25, 50, 100
  currency TEXT DEFAULT 'USD',
  
  -- Pricing
  cost NUMERIC(10,2) NOT NULL, -- Nuestro costo
  selling_price NUMERIC(10,2) NOT NULL, -- Precio al público (cost * 1.05)
  margin NUMERIC(10,2) GENERATED ALWAYS AS (selling_price - cost) STORED,
  
  -- Code
  code TEXT NOT NULL UNIQUE,
  pin TEXT,
  
  -- Status
  is_sold BOOLEAN DEFAULT FALSE,
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_to_user_id UUID REFERENCES auth.users(id),
  
  -- Expiry
  expires_at DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_gift_cards_retailer ON public.gift_card_inventory(retailer);
CREATE INDEX idx_gift_cards_available ON public.gift_card_inventory(is_sold) WHERE is_sold = FALSE;

-- RLS
ALTER TABLE public.gift_card_inventory ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven gift cards que compraron
CREATE POLICY "Users can view purchased gift cards"
ON public.gift_card_inventory
FOR SELECT
USING (auth.uid() = sold_to_user_id);

-- Nadie puede ver códigos sin comprar (se maneja en edge function)
```

**Criterio de Éxito Sección 2.1:**
- ✅ 3 tablas creadas con índices
- ✅ RLS configurado
- ✅ Full-text search funcionando

---

### 2.2 Product Catalog Setup

**T2.4 - Integración Amazon Associates API** (4 horas)

Registrarse en Amazon Associates, obtener API keys, implementar búsqueda de productos.

**T2.5 - Web Scraping (alternativa a API)** (6 horas)

Si no se aprueba en Amazon Associates, implementar scraping ético.

**T2.6 - Poblar Base de Datos** (2 horas)

Script para insertar top 100 productos por categoría:

```typescript
// scripts/seed-affiliate-products.ts
const topProducts = [
  { name: 'AirPods Pro', category: 'electronics', price: 249.99, ... },
  // ...
];

for (const product of topProducts) {
  await supabase.from('affiliate_products').insert(product);
}
```

**T2.7 - Cronjob de Actualización de Precios** (3 horas)

Edge function que corra diariamente para actualizar precios.

**Criterio de Éxito Sección 2.2:**
- ✅ API de Amazon funcionando o scraping implementado
- ✅ 100+ productos en base de datos
- ✅ Precios actualizados automáticamente

---

### 2.3 Backend - Affiliate System

**T2.8 - Edge Function: generate-affiliate-link** (3 horas)

```typescript
// supabase/functions/generate-affiliate-link/index.ts
serve(async (req) => {
  const { product_id } = await req.json();
  const user_id = getUserFromJWT(req);

  // Obtener producto
  const { data: product } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('id', product_id)
    .single();

  // Generar link personalizado con tracking
  const trackingId = `giftapp-${user_id.slice(0, 8)}`;
  const affiliate_url = product.affiliate_link.replace('TAG', trackingId);

  // Registrar click
  await supabase.from('affiliate_clicks').insert({
    user_id,
    product_id,
    ip_address: req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent'),
  });

  return new Response(JSON.stringify({ affiliate_url }), { status: 200 });
});
```

**T2.9 - Mejorar Edge Function: search-products** (3 horas)

Ya existe, agregar:
- Filtros: categoría, rango de precio, rating mínimo
- Ordenamiento: precio, rating, popularidad
- Paginación
- Return productos con affiliate links embebidos

**T2.10 - Edge Function: webhook-affiliate-conversion** (2 horas)

Recibir webhooks de Amazon/eBay cuando hay conversión.

**T2.11 - Edge Function: purchase-gift-card** (4 horas)

```typescript
serve(async (req) => {
  const { gift_card_id, payment_method_id } = await req.json();
  const user_id = getUserFromJWT(req);

  // Verificar disponibilidad
  const { data: card } = await supabase
    .from('gift_card_inventory')
    .select('*')
    .eq('id', gift_card_id)
    .eq('is_sold', false)
    .single();

  if (!card) {
    return new Response(JSON.stringify({ error: 'Card not available' }), { status: 400 });
  }

  // Procesar pago con Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: card.selling_price * 100,
    currency: card.currency.toLowerCase(),
    payment_method: payment_method_id,
    confirm: true,
  });

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment failed');
  }

  // Marcar como vendido
  await supabase
    .from('gift_card_inventory')
    .update({
      is_sold: true,
      sold_at: new Date().toISOString(),
      sold_to_user_id: user_id,
    })
    .eq('id', gift_card_id);

  // Enviar código por email
  await resend.emails.send({
    to: userEmail,
    subject: `Tu Gift Card de ${card.retailer}`,
    html: `
      <h1>¡Tu gift card está lista!</h1>
      <p>Código: <strong>${card.code}</strong></p>
      ${card.pin ? `<p>PIN: <strong>${card.pin}</strong></p>` : ''}
    `,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

**Criterio de Éxito Sección 2.3:**
- ✅ 4 edge functions funcionando
- ✅ Affiliate links generándose correctamente
- ✅ Clicks trackeados
- ✅ Gift cards vendiéndose exitosamente

---

### 2.4 Frontend - Product Discovery

**T2.12 - Página /marketplace** (8 horas)

Grid de productos con filtros, búsqueda, y affiliate links.

**T2.13 - Componente ProductSuggestions** (4 horas)

Al agregar item a wishlist, sugerir productos similares:

```typescript
// src/components/ProductSuggestions.tsx
{suggestedProducts.map(product => (
  <Card key={product.id}>
    <img src={product.image_url} />
    <h3>{product.name}</h3>
    <p>${product.price}</p>
    <Button onClick={() => handleAffiliateClick(product.id)}>
      Ver en {product.affiliate_network}
    </Button>
  </Card>
))}
```

**T2.14 - Página /gift-cards** (6 horas)

Catálogo de gift cards con compra directa.

**Criterio de Éxito Sección 2.4:**
- ✅ /marketplace funcional y responsivo
- ✅ Sugerencias de productos integradas en wishlists
- ✅ /gift-cards con checkout funcionando
- ✅ UX optimizada para conversión

---

### 2.5 Analytics Dashboard (Internal Admin)

**T2.15 - Página /admin/affiliate-stats** (6 horas)

Dashboard interno para tracking de performance:
- Total clicks por producto
- Tasa de conversión (clicks → compras)
- Revenue por affiliate network
- Top performing products
- Comisiones ganadas por período

**Criterio de Éxito Sección 2.5:**
- ✅ Dashboard funcional solo para admins
- ✅ Métricas actualizadas en tiempo real
- ✅ Filtros por fecha, categoría, network

---

**CHECKLIST FASE 2:**
- [ ] Catálogo de 100+ productos
- [ ] Affiliate links funcionando
- [ ] Clicks trackeados correctamente
- [ ] Gift cards vendidos exitosamente
- [ ] /marketplace publicado
- [ ] Analytics dashboard funcional
- [ ] Al menos 1 conversión de afiliado confirmada

**Tiempo Total Fase 2:** 50-60 horas  
**Criterio GO a Fase 3:** ✅ Al menos 10 clicks de afiliado y 1 gift card vendido

---

## <a name="fase-3"></a>🏢 FASE 3: PAQUETES CORPORATIVOS Y ESTACIONALES
**Duración:** 2-3 semanas  
**Estado:** 🔴 Bloqueado (requiere Fase 1)  
**Prioridad:** 🟡 MEDIA (High-Touch Sales, B2B)

### 3.1 Database Schema - Corporate

**T3.1 - Tabla corporate_accounts** (1 hora)

```sql
CREATE TABLE public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company info
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  industry TEXT,
  employees_count INTEGER,
  
  -- Contact
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Plan details
  plan_type TEXT NOT NULL, -- 'secret_santa_pro', 'annual_package', 'custom'
  pricing_tier TEXT, -- 'starter', 'growth', 'enterprise'
  annual_price NUMERIC(10,2),
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_start_date DATE,
  billing_end_date DATE,
  
  -- Features (customizable per account)
  features JSONB DEFAULT '{}',
  
  -- Manager
  manager_user_id UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'canceled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

-- Manager puede ver su corporate account
CREATE POLICY "Managers can view their corporate account"
ON public.corporate_accounts
FOR SELECT
USING (auth.uid() = manager_user_id);

-- Admins pueden ver todos
CREATE POLICY "Admins can view all corporate accounts"
ON public.corporate_accounts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
```

**T3.2 - Tabla corporate_teams** (30 min)

```sql
CREATE TABLE public.corporate_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  
  team_name TEXT NOT NULL,
  department TEXT,
  team_lead_user_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**T3.3 - Tabla corporate_team_members** (30 min)

```sql
CREATE TABLE public.corporate_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.corporate_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'team_lead')),
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

**T3.4 - Tabla seasonal_packages** (30 min)

```sql
CREATE TABLE public.seasonal_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  season TEXT NOT NULL, -- 'christmas', 'new_year', 'reyes', 'valentine', 'mothers_day'
  description TEXT,
  
  -- Pricing
  base_price NUMERIC(10,2) NOT NULL,
  price_per_participant NUMERIC(10,2),
  
  -- Limits
  min_participants INTEGER DEFAULT 10,
  max_participants INTEGER,
  
  -- Features
  includes_concierge BOOLEAN DEFAULT FALSE,
  includes_event_planning BOOLEAN DEFAULT FALSE,
  custom_theming BOOLEAN DEFAULT FALSE,
  
  -- Availability
  active_from DATE NOT NULL,
  active_until DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Criterio de Éxito Sección 3.1:**
- ✅ 4 tablas creadas
- ✅ RLS configurado
- ✅ Relaciones correctas

---

### 3.2 Backend - Corporate Portal

**T3.5 - Edge Function: create-corporate-account** (3 horas)

**T3.6 - Edge Function: invite-team-members** (3 horas)

**T3.7 - Edge Function: corporate-analytics** (4 horas)

Métricas:
- Participation rate por team
- Gift exchange completion rate
- Employee engagement score

**Criterio de Éxito Sección 3.2:**
- ✅ 3 edge functions funcionando
- ✅ Corporate accounts creándose
- ✅ Invitaciones enviándose

---

### 3.3 Frontend - Corporate Portal

**T3.8 - Página /corporate/dashboard** (8 horas)

Dashboard para corporate managers:
- Overview de equipos
- Analytics de participación
- Gestión de miembros
- Histórico de eventos

**T3.9 - Página /corporate/teams** (6 horas)

CRUD de equipos y asignación de miembros.

**T3.10 - Página /seasonal-packages** (6 horas)

Marketing page para paquetes estacionales.

**Criterio de Éxito Sección 3.3:**
- ✅ Portal corporativo funcional
- ✅ Managers pueden gestionar equipos
- ✅ Analytics visibles

---

### 3.4 Sales Enablement

**T3.11 - Página /request-demo** (4 horas)

Formulario para empresas interesadas + Calendly embed.

**T3.12 - Lead Nurturing Email Sequence** (3 horas)

Secuencia de 5 emails automáticos con case studies.

**Criterio de Éxito Sección 3.4:**
- ✅ Formulario capturando leads
- ✅ Emails enviándose automáticamente
- ✅ Calendly integrado

---

**CHECKLIST FASE 3:**
- [ ] Schema corporativo completo
- [ ] Portal corporativo funcional
- [ ] Paquetes estacionales disponibles
- [ ] Lead capture funcionando
- [ ] Al menos 1 demo agendado

**Tiempo Total Fase 3:** 40-50 horas  
**Criterio GO a Fase 4:** ✅ Al menos 1 cuenta corporativa activa

---

## <a name="fase-4"></a>📊 FASE 4: ANALYTICS Y OPTIMIZACIÓN
**Duración:** 1-2 semanas  
**Estado:** 🔴 Bloqueado (requiere Fases 1-3)  
**Prioridad:** 🟡 MEDIA (Data-Driven Decisions)

### 4.1 Revenue Analytics Dashboard

**T4.1 - Dashboard /admin/revenue** (8 horas)

Métricas clave:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn rate
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- Conversión Free → Premium

**Criterio de Éxito:**
- ✅ Dashboard funcional solo para admins
- ✅ Métricas actualizadas diariamente
- ✅ Exportable a CSV

---

### 4.2 User Behavior Tracking

**T4.2 - Integrar Google Analytics 4** (2 horas)

**T4.3 - Trackear Eventos Clave** (4 horas)

Eventos:
- `signup_completed`
- `upgrade_clicked`
- `checkout_started`
- `subscription_completed`
- `affiliate_link_clicked`
- `gift_card_purchased`

**Criterio de Éxito:**
- ✅ GA4 configurado
- ✅ Eventos trackeados correctamente
- ✅ Dashboards en GA4 funcionales

---

### 4.3 A/B Testing Infrastructure

**T4.4 - Instalar PostHog o Similar** (3 horas)

**T4.5 - Configurar Tests** (4 horas)

Ideas de tests:
- Pricing page layout
- CTA wording
- Free trial length
- Upgrade prompt timing

**Criterio de Éxito:**
- ✅ Framework de A/B testing activo
- ✅ Al menos 1 test corriendo

---

### 4.4 Performance Optimization

**T4.6 - Optimizar Queries** (4 horas)

Agregar índices faltantes, optimizar N+1.

**T4.7 - Implementar Caching** (3 horas)

Cache de productos, planes, etc.

**T4.8 - CDN para Imágenes** (2 horas)

**Criterio de Éxito:**
- ✅ Lighthouse score ≥90
- ✅ Queries < 100ms
- ✅ Imágenes optimizadas

---

**CHECKLIST FASE 4:**
- [ ] Revenue dashboard funcional
- [ ] GA4 trackeando eventos
- [ ] A/B testing activo
- [ ] Performance optimizada
- [ ] Métricas base documentadas

**Tiempo Total Fase 4:** 30-40 horas

---

## <a name="fase-5"></a>🚀 FASE 5: TESTING Y LANZAMIENTO
**Duración:** 2 semanas  
**Estado:** 🔴 Bloqueado (requiere Fases 1-4)  
**Prioridad:** 🔥 CRÍTICA (Quality Assurance + Go-to-Market)

### 5.1 Testing Exhaustivo

**T5.1 - Unit Tests** (8 horas)

Coverage ≥60% en:
- Feature gating functions
- Subscription logic
- Affiliate link generation

**T5.2 - Integration Tests** (8 horas)

Flujos completos:
- Stripe checkout
- Webhook handling
- Email sending

**T5.3 - E2E Tests** (12 horas)

Playwright tests:
- User signup → upgrade → checkout → success
- Free user hits limit → upgrade prompt
- Corporate manager creates team

**T5.4 - Load Testing** (4 horas)

Simular 1000 usuarios concurrentes.

**Criterio de Éxito:**
- ✅ 60% coverage alcanzado
- ✅ Todos los E2E tests pasando
- ✅ Load test exitoso

---

### 5.2 Security Audit

**T5.5 - RLS Review** (4 horas)

Verificar todas las policies.

**T5.6 - Input Validation** (3 horas)

**T5.7 - Rate Limiting** (2 horas)

**T5.8 - GDPR Compliance** (3 horas)

**Criterio de Éxito:**
- ✅ No vulnerabilidades críticas
- ✅ GDPR compliant
- ✅ Rate limiting activo

---

### 5.3 Documentation

**T5.9 - API Documentation** (4 horas)

**T5.10 - User Guides** (4 horas)

**T5.11 - Corporate Onboarding Guide** (3 horas)

**Criterio de Éxito:**
- ✅ Docs publicados
- ✅ Troubleshooting guide completo

---

### 5.4 Soft Launch (Beta)

**T5.12 - Invitar 50 Beta Users** (1 semana)

Ofrecer 50% descuento lifetime.

**T5.13 - Recolectar Feedback** (ongoing)

Typeform survey.

**T5.14 - Iterar basado en feedback** (1 semana)

**Criterio de Éxito:**
- ✅ 50 usuarios beta activos
- ✅ 20+ respuestas en survey
- ✅ Al menos 5 paying customers

---

### 5.5 Marketing Launch

**T5.15 - Landing Page Actualizado** (4 horas)

**T5.16 - Blog Post de Anuncio** (2 horas)

**T5.17 - Social Media Campaign** (ongoing)

**T5.18 - Product Hunt Launch** (1 día)

**Criterio de Éxito:**
- ✅ Landing page live
- ✅ Product Hunt listing aprobado
- ✅ 100+ visits day 1

---

### 5.6 Post-Launch Monitoring

**T5.19 - Dashboard de Salud** (3 horas)

Monitoreo de uptime, errores, pagos.

**T5.20 - Slack Alerts** (2 horas)

Alertas para:
- Pagos fallidos
- Errores críticos
- Downtimes

**Criterio de Éxito:**
- ✅ Monitoreo activo 24/7
- ✅ Alertas funcionando
- ✅ Runbook documentado

---

**CHECKLIST FASE 5:**
- [ ] Tests pasando (unit, integration, E2E)
- [ ] Security audit completado
- [ ] Documentación publicada
- [ ] Beta launch exitoso
- [ ] Marketing launch ejecutado
- [ ] Monitoreo activo

**Tiempo Total Fase 5:** 60-70 horas  
**Criterio LAUNCH:** ✅ Todos los checklist completados + 10 paying customers

---

## <a name="anexos"></a>📚 ANEXOS

### A. Métricas de Éxito

**Mes 1 Post-Launch:**
- 10 suscripciones Premium (MRR: $100)
- 100 affiliate clicks
- 5 conversiones affiliate ($20 comisión)

**Mes 3:**
- 50 suscripciones Premium (MRR: $500)
- 500 affiliate clicks
- 2% conversion rate ($100 comisión/mes)

**Mes 6:**
- 200 suscripciones Premium (MRR: $2,000)
- 2,000 affiliate clicks/mes
- 5 clientes corporativos
- ARR: $30,000

**Año 1:**
- ARR: $110,000

---

### B. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Stripe integration falla | Baja | Alto | Testing exhaustivo, sandbox completo |
| Baja conversión Free→Premium | Media | Alto | A/B testing, mejorar value prop |
| Affiliate links no generan revenue | Media | Medio | Diversificar networks |
| Churn alto en 3 meses | Media | Alto | Onboarding excelente, quick wins |

---

### C. Priorización

**MUST HAVE (No lanzar sin esto):**
1. Stripe subscriptions + feature gating
2. Pricing page + checkout
3. Email notifications básicas
4. Roles y permisos

**SHOULD HAVE (Sub-óptimo sin esto):**
1. Affiliate marketplace
2. Analytics dashboard
3. Seasonal packages

**NICE TO HAVE (Post-launch):**
1. Corporate portal avanzado
2. A/B testing
3. Gift card marketplace

---

### D. Timeline Visual

```
FASE 0: ████████ (1-2 semanas)
FASE 1: ████████████████ (3-4 semanas)
FASE 2: ████████████ (2-3 semanas)
FASE 3: ████████████ (2-3 semanas)
FASE 4: ████████ (1-2 semanas)
FASE 5: ████████████████ (2 semanas)
-------------------------------------------
TOTAL:  ~~~~~~~~~~~~~~~~ (12-16 semanas)
```

---

### E. Checklist de Inicio

Antes de empezar:
- [ ] Backup completo de DB
- [ ] Cuenta Stripe creada
- [ ] API keys de Stripe obtenidas
- [ ] Cuenta Resend configurada
- [ ] Decisión sobre affiliate networks
- [ ] Pricing final aprobado ($4.99, $19.99)
- [ ] Design system actualizado
- [ ] Stakeholders alineados en timeline

---

**PRÓXIMO PASO:** Comenzar con **FASE 0.1 - Roles y Permisos** 🚀

**Última actualización:** 2025-01-11  
**Versión:** 1.0  
**Aprobado por:** [Pending]
