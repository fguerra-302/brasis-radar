-- 1. CRITICAL: Restrict emergency functions to service_role only
REVOKE EXECUTE ON FUNCTION public.emergency_disable_all_rls() FROM public;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() FROM public;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_sources() FROM public;
REVOKE EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() FROM public;

GRANT EXECUTE ON FUNCTION public.emergency_disable_all_rls() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_sources() TO service_role;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() TO service_role;

-- 2. Fix updated_at triggers for all tables
CREATE TRIGGER update_radar_sources_updated_at
    BEFORE UPDATE ON public.radar_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER update_radar_brasis_updated_at
    BEFORE UPDATE ON public.radar_brasis
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER update_radar_keywords_updated_at
    BEFORE UPDATE ON public.radar_keywords
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_radar_sources_user_id_active ON public.radar_sources(user_id, active);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_id_status ON public.radar_brasis(user_id, status);
CREATE INDEX IF NOT EXISTS idx_radar_keywords_user_id ON public.radar_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 4. Ensure unique constraints are per user where needed
-- radar_sources already has proper structure
-- radar_keywords already has proper structure  
-- radar_brasis already has proper structure