-- Tabla para almacenar auditorías de GitHub Actions
CREATE TABLE public.github_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository TEXT NOT NULL,
  branch TEXT,
  commit_sha TEXT,
  commit_message TEXT,
  workflow_name TEXT NOT NULL,
  workflow_run_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  audit_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  findings_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_github_audit_logs_repository ON public.github_audit_logs(repository);
CREATE INDEX idx_github_audit_logs_created_at ON public.github_audit_logs(created_at DESC);
CREATE INDEX idx_github_audit_logs_status ON public.github_audit_logs(status);
CREATE INDEX idx_github_audit_logs_commit_sha ON public.github_audit_logs(commit_sha);

-- Habilitar RLS
ALTER TABLE public.github_audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver los logs de auditoría
CREATE POLICY "Admins can view all audit logs"
ON public.github_audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Solo admins pueden eliminar logs antiguos
CREATE POLICY "Admins can delete audit logs"
ON public.github_audit_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Comentarios para documentación
COMMENT ON TABLE public.github_audit_logs IS 'Almacena informes de auditoría recibidos desde GitHub Actions';
COMMENT ON COLUMN public.github_audit_logs.audit_data IS 'Datos completos del payload de GitHub Actions';
COMMENT ON COLUMN public.github_audit_logs.findings_summary IS 'Resumen estructurado de hallazgos de auditoría';