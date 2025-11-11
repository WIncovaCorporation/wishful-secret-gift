
-- Tabla para guardar credenciales de Amazon PA-API de usuarios
CREATE TABLE IF NOT EXISTS public.amazon_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  associate_tag TEXT NOT NULL,
  marketplace TEXT NOT NULL DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.amazon_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own credentials"
  ON public.amazon_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON public.amazon_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON public.amazon_credentials
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON public.amazon_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_amazon_credentials_updated_at
  BEFORE UPDATE ON public.amazon_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla para tracking de búsquedas de Amazon
CREATE TABLE IF NOT EXISTS public.amazon_search_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.amazon_search_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON public.amazon_search_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_amazon_search_tracking_user_id ON public.amazon_search_tracking(user_id);
CREATE INDEX idx_amazon_search_tracking_created_at ON public.amazon_search_tracking(created_at DESC);
