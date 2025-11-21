-- ================================================================
-- PARTE 1: SISTEMA DE ADMINISTRADORES CON ACCESO ILIMITADO
-- ================================================================

-- 1.1: Crear función helper simplificada para verificar admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- 1.2: Agregar políticas de admin para TODAS las tablas existentes
-- Esto da acceso total a admins sin interferir con políticas existentes

-- ai_usage_tracking
CREATE POLICY "Admins have full access to ai_usage_tracking"
ON public.ai_usage_tracking FOR ALL
USING (is_admin());

-- ai_suggestion_limits
CREATE POLICY "Admins have full access to ai_suggestion_limits"
ON public.ai_suggestion_limits FOR ALL
USING (is_admin());

-- anonymous_message_limits
CREATE POLICY "Admins have full access to anonymous_message_limits"
ON public.anonymous_message_limits FOR ALL
USING (is_admin());

-- anonymous_messages
CREATE POLICY "Admins can view all anonymous messages"
ON public.anonymous_messages FOR SELECT
USING (is_admin());

-- gift_items
CREATE POLICY "Admins can view all gift items"
ON public.gift_items FOR SELECT
USING (is_admin());

-- gift_lists
CREATE POLICY "Admins can view all gift lists"
ON public.gift_lists FOR SELECT
USING (is_admin());

-- gift_exchanges
CREATE POLICY "Admins can manage all gift exchanges"
ON public.gift_exchanges FOR ALL
USING (is_admin());

-- group_members
CREATE POLICY "Admins can manage all group members"
ON public.group_members FOR ALL
USING (is_admin());

-- groups
CREATE POLICY "Admins can manage all groups"
ON public.groups FOR ALL
USING (is_admin());

-- events
CREATE POLICY "Admins can manage all events"
ON public.events FOR ALL
USING (is_admin());

-- amazon_credentials
CREATE POLICY "Admins can view all amazon credentials"
ON public.amazon_credentials FOR SELECT
USING (is_admin());

-- amazon_search_tracking
CREATE POLICY "Admins can view all amazon searches"
ON public.amazon_search_tracking FOR SELECT
USING (is_admin());

-- usage_tracking
CREATE POLICY "Admins can view all usage tracking"
ON public.usage_tracking FOR SELECT
USING (is_admin());

-- ================================================================
-- PARTE 2: ASIGNAR USUARIOS COMO ADMINS
-- ================================================================

-- Nota: Necesitamos los user_id de estos emails desde auth.users
-- Por seguridad, esto debe hacerse manualmente por cada email cuando se registren

-- Función para auto-asignar admin a emails específicos cuando se creen perfiles
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Obtener email del usuario desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Si es uno de los 3 emails admin, asignar rol automáticamente
  IF user_email IN (
    'givlyn.app@gmail.com',
    'ventas@wincova.com',
    'juancovaviajes@gmail.com'
  ) THEN
    -- Insertar rol de admin si no existe
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.user_id, 'admin'::app_role, NEW.user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role auto-assigned to user: %', user_email;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para auto-asignar admin cuando se cree un profile
DROP TRIGGER IF EXISTS trigger_auto_assign_admin ON public.profiles;
CREATE TRIGGER trigger_auto_assign_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- ================================================================
-- PARTE 3: INFRAESTRUCTURA DE AFILIADOS (MONETIZACIÓN)
-- ================================================================

-- 3.1: Tabla de configuración de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text UNIQUE NOT NULL,
  affiliate_id text,
  is_active boolean DEFAULT false,
  commission_rate numeric(5, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_config ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar configuración de afiliados
CREATE POLICY "Admins can manage affiliate config"
ON public.affiliate_config FOR ALL
USING (is_admin());

-- Insertar tiendas por defecto
INSERT INTO public.affiliate_config (store_name, is_active, commission_rate, notes) VALUES
  ('amazon', false, 4.00, 'Amazon Associates - Pending registration'),
  ('walmart', false, 4.00, 'Walmart Affiliates - Pending registration'),
  ('target', false, 5.00, 'Target Partners - Pending registration'),
  ('etsy', false, 4.00, 'Etsy Affiliates - Pending registration'),
  ('ebay', false, 5.00, 'eBay Partner Network - Pending registration')
ON CONFLICT (store_name) DO NOTHING;

-- 3.2: Tabla de tracking de clicks de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  product_name text,
  product_link text NOT NULL,
  store_name text,
  session_id text,
  ip_address text,
  user_agent text,
  clicked_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver todos los clicks
CREATE POLICY "Admins can view all affiliate clicks"
ON public.affiliate_clicks FOR SELECT
USING (is_admin());

-- Todos pueden registrar clicks (para tracking anónimo)
CREATE POLICY "Anyone can insert affiliate clicks"
ON public.affiliate_clicks FOR INSERT
WITH CHECK (true);

-- ================================================================
-- PARTE 4: FUNCIONES HELPER
-- ================================================================

-- 4.1: Función para obtener email de usuario (helper para queries)
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$;

-- 4.2: Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_affiliate_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_affiliate_config_updated_at ON public.affiliate_config;
CREATE TRIGGER trigger_update_affiliate_config_updated_at
  BEFORE UPDATE ON public.affiliate_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_affiliate_config_updated_at();