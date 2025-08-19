-- 1. CRITICAL: Restrict emergency functions to service_role only
REVOKE EXECUTE ON FUNCTION public.emergency_disable_all_rls() FROM public;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() FROM public;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_sources() FROM public;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() FROM public;

GRANT EXECUTE ON FUNCTION public.emergency_disable_all_rls() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_sources() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() TO service_role;

-- 2. Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_radar_sources_user_id_active ON public.radar_sources(user_id, active);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_id_status ON public.radar_brasis(user_id, status);
CREATE INDEX IF NOT EXISTS idx_radar_keywords_user_id ON public.radar_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);