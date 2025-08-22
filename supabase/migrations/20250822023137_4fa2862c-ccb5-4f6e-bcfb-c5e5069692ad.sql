-- Security fix: Prevent credentials from being exposed in SELECT queries
-- Simple approach: revoke column-level SELECT access

-- Create secure functions for credential management
CREATE OR REPLACE FUNCTION public.source_has_credentials(source_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT credentials IS NOT NULL 
  FROM radar_sources 
  WHERE id = source_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.update_source_credentials(
  source_id uuid,
  new_credentials jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE radar_sources 
  SET 
    credentials = new_credentials,
    updated_at = now()
  WHERE id = source_id AND user_id = auth.uid();
  
  -- Log credential access for security audit
  PERFORM log_security_event('credentials_updated', auth.uid(), 
    jsonb_build_object('source_id', source_id));
END;
$$;

-- Revoke direct SELECT access to credentials column
-- This prevents the frontend from reading credentials in regular queries
REVOKE SELECT(credentials) ON public.radar_sources FROM anon, authenticated;

-- Grant access to all other columns except credentials
GRANT SELECT(id, name, url, type, active, config, external_api_config, last_sync, created_at, updated_at, user_id) 
ON public.radar_sources TO anon, authenticated;

-- Log this security enhancement
SELECT log_security_event('credentials_security_enhanced', null, 
  jsonb_build_object('action', 'revoked_credentials_select_access'));