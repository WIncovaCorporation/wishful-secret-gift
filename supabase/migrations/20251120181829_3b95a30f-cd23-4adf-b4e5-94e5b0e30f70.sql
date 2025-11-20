-- 🔒 SECURITY FIX: Proteger datos sensibles en affiliate_clicks
-- Issue: EXPOSED_SENSITIVE_DATA - IPs, user agents, y referrer URLs expuestos

-- 1. Eliminar políticas inseguras existentes
DROP POLICY IF EXISTS "System can insert clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Users can view own clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.affiliate_clicks;

-- 2. Crear políticas restrictivas - SOLO ADMINS tienen acceso
CREATE POLICY "Only admins can view all click data"
ON public.affiliate_clicks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete click records"
ON public.affiliate_clicks
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Los inserts SOLO se permiten desde edge functions con service_role
-- Esta política bloqueará inserts desde el cliente
-- Los edge functions usan service_role key que bypasea RLS
CREATE POLICY "Block direct inserts from clients"
ON public.affiliate_clicks
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 4. Bloquear updates completamente (no son necesarios para tracking)
CREATE POLICY "Block all updates"
ON public.affiliate_clicks
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Comentario de seguridad:
-- ✅ IPs, user agents, y referrer URLs ahora solo visibles para admins
-- ✅ Usuarios regulares NO pueden ver datos de tracking
-- ✅ Inserts solo desde edge functions con service_role (bypassea RLS)
-- ✅ Updates bloqueados (no necesarios)
-- ✅ Deletes solo para admins