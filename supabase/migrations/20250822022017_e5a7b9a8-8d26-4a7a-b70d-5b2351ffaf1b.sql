
-- 1) Adicionar colunas para configurações de IA do usuário
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS ai_newsletter_prompt text,
  ADD COLUMN IF NOT EXISTS ai_example_audiences text[];

-- 2) Índice único para suportar upsert por user_id
-- Atenção: se existir mais de um registro por usuário, este comando falhará.
-- Caso falhe, me avise que eu resolvo a deduplicação com você.
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_key
  ON public.user_settings (user_id);

-- 3) Índices de performance

-- radar_brasis
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_status
  ON public.radar_brasis (user_id, status);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_editoria
  ON public.radar_brasis (user_id, editoria);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_created_at
  ON public.radar_brasis (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_relevancia
  ON public.radar_brasis (user_id, relevancia DESC);

-- radar_sources
CREATE INDEX IF NOT EXISTS idx_radar_sources_user
  ON public.radar_sources (user_id);
CREATE INDEX IF NOT EXISTS idx_radar_sources_user_active
  ON public.radar_sources (user_id, active);
CREATE INDEX IF NOT EXISTS idx_radar_sources_user_type
  ON public.radar_sources (user_id, type);

-- radar_keywords
CREATE INDEX IF NOT EXISTS idx_radar_keywords_user
  ON public.radar_keywords (user_id);
CREATE INDEX IF NOT EXISTS idx_radar_keywords_user_category
  ON public.radar_keywords (user_id, category_name);

-- 4) Triggers de updated_at usando a função pública audit_updated_at()

-- radar_brasis
DROP TRIGGER IF EXISTS set_radar_brasis_updated_at ON public.radar_brasis;
CREATE TRIGGER set_radar_brasis_updated_at
  BEFORE UPDATE ON public.radar_brasis
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

-- radar_sources
DROP TRIGGER IF EXISTS set_radar_sources_updated_at ON public.radar_sources;
CREATE TRIGGER set_radar_sources_updated_at
  BEFORE UPDATE ON public.radar_sources
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

-- radar_keywords
DROP TRIGGER IF EXISTS set_radar_keywords_updated_at ON public.radar_keywords;
CREATE TRIGGER set_radar_keywords_updated_at
  BEFORE UPDATE ON public.radar_keywords
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

-- user_settings
DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

-- 5) Proteger funções de emergência: exigir service_role + permissões de execução

-- emergency_disable_all_rls
CREATE OR REPLACE FUNCTION public.emergency_disable_all_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  claims json;
BEGIN
  SELECT current_setting('request.jwt.claims', true)::json INTO claims;
  IF COALESCE(claims->>'role','') <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden: service_role required';
  END IF;

  ALTER TABLE public.radar_keywords DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.radar_sources DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.radar_brasis DISABLE ROW LEVEL SECURITY;

  PERFORM public.log_security_event('emergency_disable_all_rls', NULL, '{}'::jsonb);
  RAISE NOTICE 'RLS desabilitado em todas as tabelas - rollback completo executado';
END;
$function$;

REVOKE ALL ON FUNCTION public.emergency_disable_all_rls() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emergency_disable_all_rls() TO service_role;

-- emergency_disable_rls_brasis
CREATE OR REPLACE FUNCTION public.emergency_disable_rls_brasis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  claims json;
BEGIN
  SELECT current_setting('request.jwt.claims', true)::json INTO claims;
  IF COALESCE(claims->>'role','') <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden: service_role required';
  END IF;

  ALTER TABLE public.radar_brasis DISABLE ROW LEVEL SECURITY;

  PERFORM public.log_security_event('emergency_disable_rls_brasis', NULL, '{}'::jsonb);
  RAISE NOTICE 'RLS desabilitado para radar_brasis - rollback executado';
END;
$function$;

REVOKE ALL ON FUNCTION public.emergency_disable_rls_brasis() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() TO service_role;

-- emergency_disable_rls_sources
CREATE OR REPLACE FUNCTION public.emergency_disable_rls_sources()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  claims json;
BEGIN
  SELECT current_setting('request.jwt.claims', true)::json INTO claims;
  IF COALESCE(claims->>'role','') <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden: service_role required';
  END IF;

  ALTER TABLE public.radar_sources DISABLE ROW LEVEL SECURITY;

  PERFORM public.log_security_event('emergency_disable_rls_sources', NULL, '{}'::jsonb);
  RAISE NOTICE 'RLS desabilitado para radar_sources - rollback executado';
END;
$function$;

REVOKE ALL ON FUNCTION public.emergency_disable_rls_sources() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_sources() TO service_role;

-- emergency_disable_rls_keywords
CREATE OR REPLACE FUNCTION public.emergency_disable_rls_keywords()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  claims json;
BEGIN
  SELECT current_setting('request.jwt.claims', true)::json INTO claims;
  IF COALESCE(claims->>'role','') <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden: service_role required';
  END IF;

  ALTER TABLE public.radar_keywords DISABLE ROW LEVEL SECURITY;

  PERFORM public.log_security_event('emergency_disable_rls_keywords', NULL, '{}'::jsonb);
  RAISE NOTICE 'RLS desabilitado para radar_keywords - rollback executado';
END;
$function$;

REVOKE ALL ON FUNCTION public.emergency_disable_rls_keywords() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() TO service_role;
