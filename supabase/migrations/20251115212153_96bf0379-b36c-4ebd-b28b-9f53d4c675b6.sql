-- Crear tabla para almacenar correcciones individuales de AI
CREATE TABLE IF NOT EXISTS public.ai_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id UUID NOT NULL REFERENCES public.github_audit_logs(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'important', 'suggestion')),
  file_path TEXT NOT NULL,
  line_number INTEGER,
  issue_title TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  code_before TEXT,
  code_after TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agregar índices para búsquedas eficientes
CREATE INDEX idx_ai_corrections_audit_log ON public.ai_corrections(audit_log_id);
CREATE INDEX idx_ai_corrections_severity ON public.ai_corrections(severity);
CREATE INDEX idx_ai_corrections_status ON public.ai_corrections(status);
CREATE INDEX idx_ai_corrections_file ON public.ai_corrections(file_path);

-- Agregar columna para análisis completo de OpenAI en audit logs
ALTER TABLE public.github_audit_logs 
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_ai_corrections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_corrections_updated_at
BEFORE UPDATE ON public.ai_corrections
FOR EACH ROW
EXECUTE FUNCTION update_ai_corrections_updated_at();

-- Habilitar RLS
ALTER TABLE public.ai_corrections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Solo admins pueden ver y gestionar correcciones
CREATE POLICY "Admins can view all corrections"
ON public.ai_corrections
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update corrections"
ON public.ai_corrections
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete corrections"
ON public.ai_corrections
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir inserción desde webhook (service role)
CREATE POLICY "Service role can insert corrections"
ON public.ai_corrections
FOR INSERT
TO service_role
WITH CHECK (true);

COMMENT ON TABLE public.ai_corrections IS 'Correcciones individuales generadas por OpenAI durante auditorías de código';
COMMENT ON COLUMN public.ai_corrections.severity IS 'Severidad: critical (seguridad/bugs), important (calidad/performance), suggestion (mejoras opcionales)';
COMMENT ON COLUMN public.ai_corrections.status IS 'Estado: pending (sin revisar), approved (aprobada para aplicar), rejected (rechazada), applied (ya aplicada)';