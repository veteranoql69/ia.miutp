-- Migración: Tablas SIMCE para analítica educacional e integración con IA

-- 1. miutp_simce_ensayos: Guarda la configuración macro del ensayo y el output JSONB de la IA
CREATE TABLE IF NOT EXISTS public.miutp_simce_ensayos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID, -- Foreign key a colegios (si existe la tabla)
    creado_por UUID REFERENCES auth.users(id), -- Jefa UTP
    nivel VARCHAR(255) NOT NULL,
    letra VARCHAR(50) NOT NULL,
    asignatura VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'configurado',
    catalogo_ia JSONB, -- Almacena todo el texto largo devuelto por Gemini (OAs, Habilidades generales)
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. miutp_simce_objetivos: Guarda los OAs estructurados si se desean
CREATE TABLE IF NOT EXISTS public.miutp_simce_objetivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ensayo_id UUID NOT NULL REFERENCES public.miutp_simce_ensayos(id) ON DELETE CASCADE,
    codigo VARCHAR(255),
    descripcion TEXT
);

-- 3. miutp_simce_pautas: La clave de respuestas estructurada relacionalmente
CREATE TABLE IF NOT EXISTS public.miutp_simce_pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ensayo_id UUID NOT NULL REFERENCES public.miutp_simce_ensayos(id) ON DELETE CASCADE,
    numero_pregunta INTEGER NOT NULL,
    alternativa_correcta VARCHAR(10) NOT NULL,
    habilidad_evaluada VARCHAR(255),
    oa_codigo VARCHAR(255), -- Código del OA extraído por la IA (referencia lógica a catalogo_ia)
    UNIQUE(ensayo_id, numero_pregunta)
);

-- 4. miutp_simce_alumnos: Estudiantes que rinden el ensayo
CREATE TABLE IF NOT EXISTS public.miutp_simce_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ensayo_id UUID NOT NULL REFERENCES public.miutp_simce_ensayos(id) ON DELETE CASCADE,
    rut VARCHAR(50),
    nombre_completo VARCHAR(255) NOT NULL
);

-- 5. miutp_simce_respuestas: Tabla transaccional para la carga de hojas (Futuro)
CREATE TABLE IF NOT EXISTS public.miutp_simce_respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ensayo_id UUID NOT NULL REFERENCES public.miutp_simce_ensayos(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES public.miutp_simce_alumnos(id) ON DELETE CASCADE,
    pauta_id UUID NOT NULL REFERENCES public.miutp_simce_pautas(id) ON DELETE CASCADE,
    alternativa_marcada VARCHAR(10),
    es_correcta BOOLEAN,
    fecha_escaneo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alumno_id, pauta_id)
);

-- Habilitar Row Level Security (RLS) básico (Ajustar políticas según necesidad del negocio)
ALTER TABLE public.miutp_simce_ensayos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_simce_objetivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_simce_pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_simce_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_simce_respuestas ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para permitir todo mientras se desarrolla (reemplazar luego)
CREATE POLICY "Enable all for authenticated users" ON public.miutp_simce_ensayos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.miutp_simce_objetivos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.miutp_simce_pautas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.miutp_simce_alumnos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.miutp_simce_respuestas FOR ALL TO authenticated USING (true) WITH CHECK (true);
