-- ──────────────────────────────────────────────────────────────────────
-- miUTP - SCRIPT DE MIGRACIÓN INICIAL (ESQUEMA Y RLS)
-- Ubicación: supabase/migrations/20260525000000_init_schema.sql
-- ──────────────────────────────────────────────────────────────────────

-- 1. Extensiones recomendadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Creación de Tablas con prefijo miutp_

-- 2.1 Colegio
CREATE TABLE IF NOT EXISTS public.miutp_colegios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    rbd VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('TP', 'HC')), -- Técnico Profesional o Científico Humanista
    dependencia VARCHAR(50), -- Municipal, Subvencionado, Particular, SLEP
    comuna VARCHAR(100),
    configuracion_ia JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Perfiles de Usuario (Jefe de UTP, Profesor, Administrador)
CREATE TABLE IF NOT EXISTS public.miutp_perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'utp', 'profesor')),
    colegio_id UUID REFERENCES public.miutp_colegios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 Cursos
CREATE TABLE IF NOT EXISTS public.miutp_cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colegio_id UUID REFERENCES public.miutp_colegios(id) ON DELETE CASCADE NOT NULL,
    nivel VARCHAR(50) NOT NULL, -- e.g. "2 Medio"
    letra CHAR(1) NOT NULL,    -- e.g. "A", "B"
    ano_academico INT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(colegio_id, nivel, letra, ano_academico)
);

-- 2.4 Estudiantes
CREATE TABLE IF NOT EXISTS public.miutp_estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rut VARCHAR(20) UNIQUE NOT NULL, -- Identificador único en Chile
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    genero CHAR(1) CHECK (genero IN ('M', 'F', 'O')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5 Matrículas (Vincula Alumno a Curso y Año)
CREATE TABLE IF NOT EXISTS public.miutp_matriculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID REFERENCES public.miutp_estudiantes(id) ON DELETE CASCADE NOT NULL,
    curso_id UUID REFERENCES public.miutp_cursos(id) ON DELETE CASCADE NOT NULL,
    ano_academico INT NOT NULL,
    activo BOOLEAN DEFAULT true NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(estudiante_id, curso_id, ano_academico)
);

-- 2.6 Profesores Asignados a Cursos
CREATE TABLE IF NOT EXISTS public.miutp_profesores_cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID REFERENCES public.miutp_perfiles(id) ON DELETE CASCADE NOT NULL,
    curso_id UUID REFERENCES public.miutp_cursos(id) ON DELETE CASCADE NOT NULL,
    asignatura VARCHAR(100) NOT NULL, -- e.g. "Lenguaje", "Matemática"
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(perfil_id, curso_id, asignatura)
);

-- 2.7 Estándares de Aprendizaje (Mineduc)
CREATE TABLE IF NOT EXISTS public.miutp_estandares_aprendizaje (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nivel_educativo VARCHAR(50) NOT NULL, -- e.g. "2 Medio"
    asignatura VARCHAR(100) NOT NULL,     -- e.g. "Lectura"
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 Objetivos de Aprendizaje (OA)
CREATE TABLE IF NOT EXISTS public.miutp_objetivos_aprendizaje (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL, -- e.g. "OA 8"
    descripcion TEXT NOT NULL,
    eje_tematico VARCHAR(100),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 Habilidades (SIMCE/Mineduc)
CREATE TABLE IF NOT EXISTS public.miutp_habilidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL, -- e.g. "Localizar", "Reflexionar"
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.10 Pruebas / Ensayos
CREATE TABLE IF NOT EXISTS public.miutp_pruebas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    asignado_por UUID REFERENCES public.miutp_perfiles(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    meta_datos JSONB DEFAULT '{}'::jsonb
);

-- 2.11 Preguntas de Pruebas
CREATE TABLE IF NOT EXISTS public.miutp_preguntas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prueba_id UUID REFERENCES public.miutp_pruebas(id) ON DELETE CASCADE NOT NULL,
    numero_pregunta INT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('alternativa', 'desarrollo')),
    alternativa_correcta CHAR(1) CHECK (alternativa_correcta IN ('A', 'B', 'C', 'D', 'E')),
    oa_id UUID REFERENCES public.miutp_objetivos_aprendizaje(id) ON DELETE SET NULL,
    habilidad_id UUID REFERENCES public.miutp_habilidades(id) ON DELETE SET NULL,
    texto_pregunta TEXT,
    puntaje INT DEFAULT 1 NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(prueba_id, numero_pregunta)
);

-- 2.12 Pruebas Aplicadas a un Curso
CREATE TABLE IF NOT EXISTS public.miutp_pruebas_aplicadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prueba_id UUID REFERENCES public.miutp_pruebas(id) ON DELETE CASCADE NOT NULL,
    curso_id UUID REFERENCES public.miutp_cursos(id) ON DELETE CASCADE NOT NULL,
    fecha_aplicacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado VARCHAR(20) DEFAULT 'creada' CHECK (estado IN ('creada', 'procesando', 'finalizada')),
    puntaje_promedio NUMERIC(5, 2),
    nivel_logro_promedio VARCHAR(20) CHECK (nivel_logro_promedio IN ('Adecuado', 'Elemental', 'Insuficiente')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.13 Respuestas de Estudiantes por Pregunta
CREATE TABLE IF NOT EXISTS public.miutp_respuestas_estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prueba_aplicada_id UUID REFERENCES public.miutp_pruebas_aplicadas(id) ON DELETE CASCADE NOT NULL,
    matricula_id UUID REFERENCES public.miutp_matriculas(id) ON DELETE CASCADE NOT NULL,
    pregunta_id UUID REFERENCES public.miutp_preguntas(id) ON DELETE CASCADE NOT NULL,
    respuesta_marcada CHAR(1) CHECK (respuesta_marcada IN ('A', 'B', 'C', 'D', 'E', '')), -- vacío representa omitida
    es_correcta BOOLEAN NOT NULL,
    puntaje_obtenido INT DEFAULT 0 NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(prueba_aplicada_id, matricula_id, pregunta_id)
);

-- 2.14 Recomendaciones de IA
CREATE TABLE IF NOT EXISTS public.miutp_recomendaciones_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prueba_aplicada_id UUID REFERENCES public.miutp_pruebas_aplicadas(id) ON DELETE CASCADE NOT NULL,
    curso_id UUID REFERENCES public.miutp_cursos(id) ON DELETE CASCADE NOT NULL,
    estudiante_id UUID REFERENCES public.miutp_estudiantes(id) ON DELETE CASCADE, -- opcional si es remedial para el curso completo
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('reforzamiento', 'propuesta_pregunta')),
    contenido JSONB NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. Habilitar RLS (Row Level Security)

ALTER TABLE public.miutp_colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_profesores_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_pruebas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_pruebas_aplicadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_respuestas_estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miutp_recomendaciones_ia ENABLE ROW LEVEL SECURITY;


-- 4. Definición de Políticas RLS

-- Auxiliar: Obtener el colegio_id y el rol del perfil del usuario actual autenticado
-- Se declaran políticas directas para evitar recursión de consultas.

-- 4.1 miutp_perfiles
CREATE POLICY "Permitir a usuarios ver su propio perfil" ON public.miutp_perfiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Permitir a UTP ver perfiles de su colegio" ON public.miutp_perfiles
    FOR SELECT USING (
        colegio_id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid())
    );

CREATE POLICY "Permitir a admins modificar perfiles" ON public.miutp_perfiles
    FOR ALL USING (
        (SELECT rol FROM public.miutp_perfiles WHERE id = auth.uid()) = 'admin'
    );

-- 4.2 miutp_colegios
CREATE POLICY "Permitir ver colegio asociado" ON public.miutp_colegios
    FOR SELECT USING (
        id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid())
    );

-- 4.3 miutp_cursos
CREATE POLICY "UTP ve todos los cursos de su colegio" ON public.miutp_cursos
    FOR SELECT USING (
        colegio_id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid())
    );

CREATE POLICY "Profesores ven sus cursos asignados" ON public.miutp_cursos
    FOR SELECT USING (
        id IN (
            SELECT curso_id FROM public.miutp_profesores_cursos 
            WHERE perfil_id = auth.uid()
        )
    );

CREATE POLICY "UTP crea y modifica cursos" ON public.miutp_cursos
    FOR ALL USING (
        colegio_id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid())
        AND (SELECT rol FROM public.miutp_perfiles WHERE id = auth.uid()) = 'utp'
    );

-- 4.4 miutp_estudiantes y miutp_matriculas
CREATE POLICY "UTP ve estudiantes de su colegio" ON public.miutp_estudiantes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.miutp_matriculas m
            JOIN public.miutp_cursos c ON c.id = m.curso_id
            WHERE m.estudiante_id = miutp_estudiantes.id
              AND c.colegio_id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Profesores ven estudiantes de sus cursos" ON public.miutp_estudiantes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.miutp_matriculas m
            JOIN public.miutp_profesores_cursos pc ON pc.curso_id = m.curso_id
            WHERE m.estudiante_id = miutp_estudiantes.id
              AND pc.perfil_id = auth.uid()
        )
    );

CREATE POLICY "UTP gestiona estudiantes" ON public.miutp_estudiantes
    FOR ALL USING (
        (SELECT rol FROM public.miutp_perfiles WHERE id = auth.uid()) = 'utp'
    );

CREATE POLICY "UTP gestiona matriculas" ON public.miutp_matriculas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.miutp_cursos c
            WHERE c.id = miutp_matriculas.curso_id
              AND c.colegio_id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid())
        )
        AND (SELECT rol FROM public.miutp_perfiles WHERE id = auth.uid()) = 'utp'
    );

-- 4.5 miutp_respuestas_estudiantes
CREATE POLICY "UTP ve todas las respuestas de su colegio" ON public.miutp_respuestas_estudiantes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.miutp_matriculas m
            JOIN public.miutp_cursos c ON c.id = m.curso_id
            WHERE m.id = miutp_respuestas_estudiantes.matricula_id
              AND c.colegio_id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid())
        )
        AND (SELECT rol FROM public.miutp_perfiles WHERE id = auth.uid()) = 'utp'
    );

CREATE POLICY "Profesores ven respuestas de sus cursos asignados" ON public.miutp_respuestas_estudiantes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.miutp_matriculas m
            JOIN public.miutp_profesores_cursos pc ON pc.curso_id = m.curso_id
            WHERE m.id = miutp_respuestas_estudiantes.matricula_id
              AND pc.perfil_id = auth.uid()
        )
    );

CREATE POLICY "Docentes y UTP gestionan respuestas de sus cursos" ON public.miutp_respuestas_estudiantes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.miutp_matriculas m
            JOIN public.miutp_cursos c ON c.id = m.curso_id
            LEFT JOIN public.miutp_profesores_cursos pc ON pc.curso_id = c.id
            WHERE m.id = miutp_respuestas_estudiantes.matricula_id
              AND (
                  (pc.perfil_id = auth.uid()) OR
                  ((SELECT rol FROM public.miutp_perfiles WHERE id = auth.uid()) = 'utp' AND c.colegio_id = (SELECT colegio_id FROM public.miutp_perfiles WHERE id = auth.uid()))
              )
        )
    );


-- 5. Triggers de automatización

-- Trigger: Crear perfil automático en miutp_perfiles cuando un nuevo usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.miutp_perfiles (id, nombre, rol, colegio_id)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    'profesor', -- Rol inicial por defecto, modificable por admin/utp
    null
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
