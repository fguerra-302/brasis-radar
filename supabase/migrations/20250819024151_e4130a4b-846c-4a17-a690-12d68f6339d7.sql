
-- 1) Restringir execução das funções de emergência apenas ao service_role
REVOKE EXECUTE ON FUNCTION public.emergency_disable_all_rls() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_sources() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.emergency_disable_all_rls() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_sources() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() TO service_role;

-- 2) Garantir updated_at também em INSERT nas tabelas principais
CREATE TRIGGER set_radar_brasis_updated_at_insert
  BEFORE INSERT ON public.radar_brasis
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER set_radar_sources_updated_at_insert
  BEFORE INSERT ON public.radar_sources
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER set_radar_keywords_updated_at_insert
  BEFORE INSERT ON public.radar_keywords
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER set_user_settings_updated_at_insert
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();
