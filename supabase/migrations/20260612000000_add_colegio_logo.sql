-- Agregar campo logo_url a miutp_colegios
ALTER TABLE public.miutp_colegios
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
