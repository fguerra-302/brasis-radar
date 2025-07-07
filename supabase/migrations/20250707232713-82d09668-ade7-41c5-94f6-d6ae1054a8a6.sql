-- Desabilitar temporariamente RLS para desenvolvimento
-- Isso será reativado quando a funcionalidade estiver completa

-- Desabilitar RLS nas tabelas principais
ALTER TABLE public.radar_brasis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_sources DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.radar_keywords DISABLE ROW LEVEL SECURITY;

-- Manter user_roles com RLS pois não é usado na funcionalidade principal
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;