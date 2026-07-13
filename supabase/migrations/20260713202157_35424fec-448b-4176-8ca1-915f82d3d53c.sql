
-- 1) Lock down shared_sources.credentials — only service_role may read it.
REVOKE SELECT (credentials) ON public.shared_sources FROM PUBLIC;
REVOKE SELECT (credentials) ON public.shared_sources FROM anon;
REVOKE SELECT (credentials) ON public.shared_sources FROM authenticated;

-- Ensure authenticated can still read the non-sensitive columns.
GRANT SELECT (id, name, url, type, active, config, created_at, updated_at)
  ON public.shared_sources TO authenticated;

-- 2) Revoke EXECUTE on SECURITY DEFINER has_role from anon/public.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
