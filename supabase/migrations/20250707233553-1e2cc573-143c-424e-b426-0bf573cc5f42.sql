-- Remover temporariamente foreign key constraints para desenvolvimento
-- Isso permite inserir dados sem precisar de usuários autenticados

-- Remover constraint de user_id na tabela radar_sources
ALTER TABLE public.radar_sources DROP CONSTRAINT IF EXISTS radar_sources_user_id_fkey;

-- Remover constraint de user_id na tabela radar_keywords  
ALTER TABLE public.radar_keywords DROP CONSTRAINT IF EXISTS radar_keywords_user_id_fkey;

-- Remover constraint de user_id na tabela radar_brasis
ALTER TABLE public.radar_brasis DROP CONSTRAINT IF EXISTS radar_brasis_user_id_fkey;