-- Remove legacy DB functions that reference radar_sources or pose unnecessary risk
DROP FUNCTION IF EXISTS public.emergency_disable_all_rls();
DROP FUNCTION IF EXISTS public.emergency_disable_rls_brasis();
DROP FUNCTION IF EXISTS public.emergency_disable_rls_keywords();
DROP FUNCTION IF EXISTS public.emergency_disable_rls_sources();
DROP FUNCTION IF EXISTS public.source_has_credentials(uuid);
DROP FUNCTION IF EXISTS public.update_source_credentials(uuid, jsonb);