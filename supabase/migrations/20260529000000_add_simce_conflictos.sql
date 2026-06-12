-- Migración: Tabla para almacenar conflictos en el procesamiento de hojas de respuestas SIMCE
CREATE TABLE IF NOT EXISTS public.miutp_simce_conflictos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ensayo_id UUID NOT NULL REFERENCES public.miutp_simce_ensayos(id) ON DELETE CASCADE,
  curso_letra VARCHAR(50) NOT NULL,
  nombre_detectado TEXT,
  curso_detectado TEXT,
  url_imagen_evidencia TEXT NOT NULL,
  respuestas_extraidas JSONB NOT NULL, -- Almacena el array de respuestas de la IA [{numero: X, alternativa: Y}]
  resuelto BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.miutp_simce_conflictos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.miutp_simce_conflictos;
CREATE POLICY "Enable all for authenticated users"
  ON public.miutp_simce_conflictos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
