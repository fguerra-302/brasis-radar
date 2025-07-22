
-- Desabilitar RLS temporariamente para desenvolvimento sem autenticação
ALTER TABLE public.radar_brasis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_keywords DISABLE ROW LEVEL SECURITY;

-- Remover constraint de user_id obrigatório temporariamente
ALTER TABLE public.radar_brasis ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.radar_sources ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.radar_keywords ALTER COLUMN user_id DROP NOT NULL;
