-- Tabla de invitaciones para que la Jefa de UTP invite profesores a su colegio
CREATE TABLE IF NOT EXISTS public.miutp_invitaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  colegio_id   UUID NOT NULL REFERENCES public.miutp_colegios(id) ON DELETE CASCADE,
  invitado_por UUID NOT NULL REFERENCES public.miutp_perfiles(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  rol          TEXT NOT NULL DEFAULT 'profesor',
  estado       TEXT NOT NULL DEFAULT 'pendiente',
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (colegio_id, email)
);

ALTER TABLE public.miutp_invitaciones ENABLE ROW LEVEL SECURITY;
