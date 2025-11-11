-- ============================================
-- FASE 2: MARKETPLACE Y AFILIADOS
-- Database Schema - Affiliate System
-- ============================================

-- Tabla de productos afiliados
CREATE TABLE public.affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Pricing
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Media
  image_url TEXT,
  product_url TEXT,
  
  -- Affiliate info
  affiliate_network TEXT NOT NULL,
  affiliate_link TEXT NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 0.04,
  
  -- Metadata
  rating NUMERIC(3,2),
  reviews_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
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

-- Solo admins pueden gestionar productos
CREATE POLICY "Admins can manage products"
ON public.affiliate_products
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_affiliate_products_updated_at
BEFORE UPDATE ON public.affiliate_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de clicks en links de afiliados
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.affiliate_products(id),
  
  -- Tracking
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Conversion tracking
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

-- Sistema puede insertar clicks (desde edge function)
CREATE POLICY "System can insert clicks"
ON public.affiliate_clicks
FOR INSERT
WITH CHECK (true);

-- Tabla de inventario de gift cards
CREATE TABLE public.gift_card_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Card info
  retailer TEXT NOT NULL,
  denomination NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Pricing
  cost NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  margin NUMERIC(10,2) GENERATED ALWAYS AS (selling_price - cost) STORED,
  
  -- Code (encriptado en producción)
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

-- Admins pueden gestionar inventario
CREATE POLICY "Admins can manage gift cards"
ON public.gift_card_inventory
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DATOS INICIALES - PRODUCTOS DE EJEMPLO
-- ============================================

-- Insertar categorías populares de productos
INSERT INTO public.affiliate_products (name, description, category, price, image_url, product_url, affiliate_network, affiliate_link, rating, reviews_count) VALUES
-- Electrónica
('AirPods Pro (2da Gen)', 'Audífonos inalámbricos con cancelación activa de ruido y audio espacial', 'electronics', 249.99, 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7', 'https://amazon.com/airpods-pro', 'amazon', 'https://amazon.com/airpods-pro?tag=giftapp-20', 4.8, 15234),
('iPad Air', 'Tablet potente con chip M1 y pantalla Liquid Retina de 10.9 pulgadas', 'electronics', 599.99, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 'https://amazon.com/ipad-air', 'amazon', 'https://amazon.com/ipad-air?tag=giftapp-20', 4.7, 8932),
('PlayStation 5', 'Consola de videojuegos de última generación con SSD ultrarrápido', 'electronics', 499.99, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db', 'https://amazon.com/ps5', 'amazon', 'https://amazon.com/ps5?tag=giftapp-20', 4.9, 21045),

-- Moda
('Nike Air Force 1', 'Zapatillas clásicas de cuero con suela Air para comodidad todo el día', 'fashion', 110.00, 'https://images.unsplash.com/photo-1549298916-b41d501d3772', 'https://amazon.com/nike-air-force', 'amazon', 'https://amazon.com/nike-air-force?tag=giftapp-20', 4.6, 6543),
('Reloj Smartwatch', 'Reloj inteligente con monitor de salud y notificaciones', 'fashion', 199.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30', 'https://amazon.com/smartwatch', 'amazon', 'https://amazon.com/smartwatch?tag=giftapp-20', 4.5, 3421),

-- Hogar
('Cafetera Espresso', 'Máquina de café espresso automática con espumador de leche', 'home', 299.99, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6', 'https://amazon.com/espresso-machine', 'amazon', 'https://amazon.com/espresso-machine?tag=giftapp-20', 4.4, 2134),
('Robot Aspiradora', 'Robot aspiradora inteligente con mapeo láser y app móvil', 'home', 399.99, 'https://images.unsplash.com/photo-1558317374-067fb5f30001', 'https://amazon.com/robot-vacuum', 'amazon', 'https://amazon.com/robot-vacuum?tag=giftapp-20', 4.7, 5432),

-- Libros y Educación
('Kindle Paperwhite', 'Lector de libros electrónicos con pantalla antirreflejos y luz cálida', 'books', 139.99, 'https://images.unsplash.com/photo-1512820790803-83ca734da794', 'https://amazon.com/kindle', 'amazon', 'https://amazon.com/kindle?tag=giftapp-20', 4.8, 9876),

-- Deportes
('Yoga Mat Premium', 'Tapete de yoga antideslizante con alineación y bolsa de transporte', 'sports', 49.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f', 'https://amazon.com/yoga-mat', 'amazon', 'https://amazon.com/yoga-mat?tag=giftapp-20', 4.5, 1234),
('Mancuernas Ajustables', 'Set de mancuernas de 2 a 12 kg con sistema de ajuste rápido', 'sports', 89.99, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438', 'https://amazon.com/dumbbells', 'amazon', 'https://amazon.com/dumbbells?tag=giftapp-20', 4.6, 876);

-- Insertar gift cards de ejemplo (códigos ficticios)
INSERT INTO public.gift_card_inventory (retailer, denomination, cost, selling_price, code, pin, expires_at) VALUES
('Amazon', 25.00, 23.75, 25.00, 'AMZN-XXXX-XXXX-0001', NULL, '2026-12-31'),
('Amazon', 50.00, 47.50, 50.00, 'AMZN-XXXX-XXXX-0002', NULL, '2026-12-31'),
('Amazon', 100.00, 95.00, 100.00, 'AMZN-XXXX-XXXX-0003', NULL, '2026-12-31'),
('Spotify', 10.00, 9.50, 10.00, 'SPOT-XXXX-XXXX-0001', '1234', '2026-06-30'),
('Netflix', 25.00, 23.75, 25.00, 'NFLX-XXXX-XXXX-0001', NULL, '2026-12-31'),
('Steam', 20.00, 19.00, 20.00, 'STEM-XXXX-XXXX-0001', NULL, '2027-12-31');

-- ============================================
-- FUNCIONES DE UTILIDAD
-- ============================================

-- Función para obtener productos por categoría con paginación
CREATE OR REPLACE FUNCTION public.get_products_by_category(
  _category TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 20,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC,
  image_url TEXT,
  affiliate_link TEXT,
  rating NUMERIC,
  reviews_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, name, description, category, price, 
    image_url, affiliate_link, rating, reviews_count
  FROM public.affiliate_products
  WHERE is_active = TRUE
    AND (_category IS NULL OR category = _category)
  ORDER BY rating DESC, reviews_count DESC
  LIMIT _limit
  OFFSET _offset;
$$;

-- Función para buscar productos (full-text search)
CREATE OR REPLACE FUNCTION public.search_affiliate_products(
  _query TEXT,
  _limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC,
  image_url TEXT,
  affiliate_link TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  relevance REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, name, description, category, price,
    image_url, affiliate_link, rating, reviews_count,
    ts_rank(
      to_tsvector('spanish', name || ' ' || COALESCE(description, '')),
      plainto_tsquery('spanish', _query)
    ) as relevance
  FROM public.affiliate_products
  WHERE is_active = TRUE
    AND to_tsvector('spanish', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('spanish', _query)
  ORDER BY relevance DESC, rating DESC
  LIMIT _limit;
$$;