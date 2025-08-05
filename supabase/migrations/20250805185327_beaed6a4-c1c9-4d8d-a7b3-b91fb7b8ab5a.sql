-- PLANO SEGURO GRADUAL - FASE 2: TESTE CONTROLADO
-- Ativar RLS apenas em radar_keywords (tabela menos crítica)

-- 1. Ativar RLS na tabela radar_keywords
ALTER TABLE radar_keywords ENABLE ROW LEVEL SECURITY;

-- 2. Verificar se as políticas existentes estão funcionando
-- (As políticas já existem, só precisamos ativar o RLS)

-- 3. Criar função de rollback de emergência
CREATE OR REPLACE FUNCTION public.emergency_disable_rls_keywords()
RETURNS void AS $$
BEGIN
  ALTER TABLE radar_keywords DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS desabilitado para radar_keywords - rollback executado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Adicionar função de log de segurança (sem triggers por enquanto)
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id uuid DEFAULT auth.uid(),
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  -- Por enquanto, apenas um log simples
  -- Futuramente pode ser expandido para tabela de auditoria
  RAISE LOG 'Security Event: % - User: % - Details: %', event_type, user_id, details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;