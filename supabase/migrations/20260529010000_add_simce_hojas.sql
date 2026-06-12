-- Migración: Tabla para almacenar cabeceras de hojas de respuesta SIMCE procesadas exitosamente
CREATE TABLE IF NOT EXISTS public.miutp_simce_hojas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ensayo_id UUID NOT NULL REFERENCES public.miutp_simce_ensayos(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES public.miutp_simce_alumnos(id) ON DELETE CASCADE,
    url_imagen_evidencia TEXT NOT NULL,
    porcentaje_logro INTEGER,
    fecha_escaneo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ensayo_id, alumno_id)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.miutp_simce_hojas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.miutp_simce_hojas;
CREATE POLICY "Enable all for authenticated users"
  ON public.miutp_simce_hojas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Agregar columna para vincular respuestas con la cabecera de la hoja
ALTER TABLE public.miutp_simce_respuestas 
  ADD COLUMN IF NOT EXISTS hoja_id UUID REFERENCES public.miutp_simce_hojas(id) ON DELETE CASCADE;
