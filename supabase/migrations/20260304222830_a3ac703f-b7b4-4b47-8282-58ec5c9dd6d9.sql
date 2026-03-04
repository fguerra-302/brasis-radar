-- Revoke direct SELECT on credentials column from shared_sources
REVOKE SELECT(credentials) ON public.shared_sources FROM anon, authenticated;

-- Grant SELECT on all other columns explicitly
GRANT SELECT(id, name, url, type, active, config, created_at, updated_at) ON public.shared_sources TO anon, authenticated;