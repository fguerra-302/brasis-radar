
BEGIN;

-- Remover a unicidade global atual na coluna url
ALTER TABLE public.radar_sources
  DROP CONSTRAINT IF EXISTS radar_sources_url_key;

-- Garantir que cada usuário possa usar a mesma URL
-- (permitindo inclusive a mesma URL para tipos diferentes, se fizer sentido)
ALTER TABLE public.radar_sources
  ADD CONSTRAINT radar_sources_user_url_type_unique
  UNIQUE (user_id, url, type);

COMMIT;
