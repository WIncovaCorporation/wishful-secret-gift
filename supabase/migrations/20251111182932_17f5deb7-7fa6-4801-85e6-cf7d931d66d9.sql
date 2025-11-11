-- ============================================
-- FASE 1: SISTEMA DE SUSCRIPCIONES
-- Database Schema - Subscriptions
-- ============================================

-- Tabla de planes de suscripción disponibles
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos iniciales de planes
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_annual, features, sort_order) VALUES
('free', 'Plan Gratuito', 'Perfecto para probar', 0, 0, '{
  "max_groups": 3,
  "max_participants_per_group": 10,
  "max_wishlists": 1,
  "ai_suggestions_per_month": 0,
  "can_remove_branding": false,
  "priority_support": false
}'::jsonb, 1),
('premium_individual', 'Premium Individual', 'Para usuarios activos', 4.99, 49.99, '{
  "max_groups": 999,
  "max_participants_per_group": 50,
  "max_wishlists": 5,
  "ai_suggestions_per_month": 10,
  "can_remove_branding": true,
  "priority_support": false
}'::jsonb, 2),
('premium_business', 'Premium Business', 'Para equipos y empresas', 19.99, 199.99, '{
  "max_groups": 999,
  "max_participants_per_group": 9999,
  "max_wishlists": 999,
  "ai_suggestions_per_month": 999,
  "can_remove_branding": true,
  "priority_support": true,
  "custom_branding": true
}'::jsonb, 3);

-- RLS para subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly viewable"
ON public.subscription_plans
FOR SELECT
USING (is_active = TRUE);

-- Tabla de suscripciones activas de usuarios
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- RLS para user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de tracking de uso
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contadores
  groups_count INTEGER DEFAULT 0,
  participants_total INTEGER DEFAULT 0,
  wishlists_count INTEGER DEFAULT 0,
  ai_suggestions_used INTEGER DEFAULT 0,
  
  -- Período de tracking
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

-- Inicializar tracking para usuarios existentes
INSERT INTO public.usage_tracking (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Función para resetear contadores mensualmente
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

-- ============================================
-- FEATURE GATING FUNCTIONS
-- ============================================

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

-- Verificar si usuario puede usar IA
CREATE OR REPLACE FUNCTION public.can_use_ai(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan JSONB;
  usage_data RECORD;
  max_ai INTEGER;
BEGIN
  -- Obtener plan del usuario
  SELECT sp.features INTO user_plan
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF user_plan IS NULL THEN
    SELECT features INTO user_plan
    FROM public.subscription_plans
    WHERE name = 'free';
  END IF;

  max_ai := (user_plan->>'ai_suggestions_per_month')::INTEGER;
  
  -- Si es ilimitado (999), retornar true
  IF max_ai >= 999 THEN
    RETURN TRUE;
  END IF;

  -- Obtener uso actual
  SELECT ai_suggestions_used INTO usage_data
  FROM public.usage_tracking
  WHERE user_id = _user_id;

  RETURN COALESCE(usage_data.ai_suggestions_used, 0) < max_ai;
END;
$$;

-- Función para obtener features del usuario
CREATE OR REPLACE FUNCTION public.get_user_features(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan JSONB;
BEGIN
  SELECT sp.features INTO user_plan
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF user_plan IS NULL THEN
    SELECT features INTO user_plan
    FROM public.subscription_plans
    WHERE name = 'free';
  END IF;

  RETURN user_plan;
END;
$$;