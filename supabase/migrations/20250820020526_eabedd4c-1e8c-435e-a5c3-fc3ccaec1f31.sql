
BEGIN;

-- Remover constraints antigas de unicidade no link (podem ter nomes diferentes conforme migrações anteriores)
ALTER TABLE public.radar_brasis
  DROP CONSTRAINT IF EXISTS unique_radar_brasis_link;

ALTER TABLE public.radar_brasis
  DROP CONSTRAINT IF EXISTS radar_brasis_link_key;

-- Garantir unicidade por usuário
ALTER TABLE public.radar_brasis
  ADD CONSTRAINT radar_brasis_user_link_unique UNIQUE (user_id, link);

-- Índice de performance para listagem por usuário (RLS aplica filtro por user_id)
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_created_at
  ON public.radar_brasis(user_id, created_at DESC);

COMMIT;
