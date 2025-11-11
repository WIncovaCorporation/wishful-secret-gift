-- Agregar columna owner_id a affiliate_products para modelo híbrido
-- Si owner_id IS NULL → Producto de GiftApp (ingresos propios)
-- Si owner_id = user_id → Producto del usuario (él gana comisión)

ALTER TABLE public.affiliate_products
ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para consultas por propietario
CREATE INDEX idx_affiliate_products_owner ON public.affiliate_products(owner_id);

-- Actualizar RLS policies
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.affiliate_products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.affiliate_products;

-- Policy: Todos pueden ver productos activos (de GiftApp y usuarios)
CREATE POLICY "Anyone can view active products"
ON public.affiliate_products
FOR SELECT
USING (is_active = true);

-- Policy: Usuarios pueden crear sus propios productos
CREATE POLICY "Users can create own products"
ON public.affiliate_products
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Policy: Usuarios pueden editar sus propios productos
CREATE POLICY "Users can update own products"
ON public.affiliate_products
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Policy: Usuarios pueden eliminar sus propios productos
CREATE POLICY "Users can delete own products"
ON public.affiliate_products
FOR DELETE
USING (auth.uid() = owner_id);

-- Policy: Admins pueden gestionar productos de GiftApp (owner_id IS NULL)
CREATE POLICY "Admins can manage GiftApp products"
ON public.affiliate_products
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND owner_id IS NULL
);

-- Comentario en tabla
COMMENT ON COLUMN public.affiliate_products.owner_id IS 'NULL = GiftApp product (we earn commission), NOT NULL = User product (they earn commission)';