-- Agregar columna curso_letra a miutp_simce_alumnos para diferenciar cursos dentro del mismo ensayo
ALTER TABLE public.miutp_simce_alumnos
  ADD COLUMN IF NOT EXISTS curso_letra VARCHAR(50) DEFAULT 'A' NOT NULL;
