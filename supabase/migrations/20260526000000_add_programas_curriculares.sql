-- ──────────────────────────────────────────────────────────────────────────────
-- miUTP - MIGRACIÓN: tabla miutp_programas_curriculares + bucket evidencias_mineduc
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Tabla principal para programas curriculares procesados con IA
CREATE TABLE IF NOT EXISTS public.miutp_programas_curriculares (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_pdf_original    TEXT NOT NULL,
    contenido_markdown  TEXT NOT NULL,
    metadata_json       JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en           TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    actualizado_en      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.miutp_programas_curriculares ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
-- Usuarios autenticados pueden leer (catálogo global Mineduc, no tiene colegio_id)
CREATE POLICY "autenticados pueden leer miutp_programas_curriculares"
    ON public.miutp_programas_curriculares
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Escritura exclusiva via service role (supabaseAdmin en Server Action, bypasses RLS)
CREATE POLICY "solo service role puede insertar miutp_programas_curriculares"
    ON public.miutp_programas_curriculares
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "solo service role puede modificar miutp_programas_curriculares"
    ON public.miutp_programas_curriculares
    FOR UPDATE
    USING (false);

CREATE POLICY "solo service role puede eliminar miutp_programas_curriculares"
    ON public.miutp_programas_curriculares
    FOR DELETE
    USING (false);

-- 4. Limpiar tabla sin prefijo creada por versión anterior
DROP TABLE IF EXISTS public.programas_curriculares CASCADE;

-- 5. Bucket de Storage: evidencias_mineduc (público, solo PDFs oficiales Mineduc)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias_mineduc', 'evidencias_mineduc', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública de archivos del bucket (DROP IF EXISTS para idempotencia)
DROP POLICY IF EXISTS "lectura publica evidencias_mineduc" ON storage.objects;
CREATE POLICY "lectura publica evidencias_mineduc"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'evidencias_mineduc');
