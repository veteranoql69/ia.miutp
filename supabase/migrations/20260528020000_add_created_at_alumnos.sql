-- Agregar columna created_at a miutp_simce_alumnos con timestamp automático
ALTER TABLE public.miutp_simce_alumnos
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN public.miutp_simce_alumnos.created_at IS 'Fecha y hora de registro del alumno en el sistema';
