-- PLANO SEGURO GRADUAL - FASE 3: IMPLEMENTAÇÃO GRADUAL
-- Ativar RLS nas tabelas radar_sources e radar_brasis

-- 1. Ativar RLS na tabela radar_sources
ALTER TABLE radar_sources ENABLE ROW LEVEL SECURITY;

-- 2. Ativar RLS na tabela radar_brasis
ALTER TABLE radar_brasis ENABLE ROW LEVEL SECURITY;

-- 3. Criar funções de rollback de emergência para todas as tabelas
CREATE OR REPLACE FUNCTION public.emergency_disable_rls_sources()
RETURNS void AS $$
BEGIN
  ALTER TABLE radar_sources DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS desabilitado para radar_sources - rollback executado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.emergency_disable_rls_brasis()
RETURNS void AS $$
BEGIN
  ALTER TABLE radar_brasis DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS desabilitado para radar_brasis - rollback executado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para rollback completo se necessário
CREATE OR REPLACE FUNCTION public.emergency_disable_all_rls()
RETURNS void AS $$
BEGIN
  ALTER TABLE radar_keywords DISABLE ROW LEVEL SECURITY;
  ALTER TABLE radar_sources DISABLE ROW LEVEL SECURITY;
  ALTER TABLE radar_brasis DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS desabilitado em todas as tabelas - rollback completo executado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;