-- Título del ensayo extraído por IA
ALTER TABLE public.miutp_simce_ensayos
  ADD COLUMN IF NOT EXISTS nombre TEXT;

-- Preguntas del ensayo (texto completo para análisis por pregunta)
CREATE TABLE IF NOT EXISTS public.miutp_simce_preguntas_ensayo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ensayo_id     UUID NOT NULL REFERENCES public.miutp_simce_ensayos(id) ON DELETE CASCADE,
  numero        INTEGER NOT NULL,
  enunciado     TEXT NOT NULL,
  UNIQUE(ensayo_id, numero)
);

ALTER TABLE public.miutp_simce_preguntas_ensayo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users"
  ON public.miutp_simce_preguntas_ensayo
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
