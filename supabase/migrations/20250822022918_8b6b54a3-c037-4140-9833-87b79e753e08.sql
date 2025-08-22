-- Security fix: Prevent credentials from being exposed in SELECT queries
-- This maintains INSERT/UPDATE functionality while securing sensitive data

-- Create a view that excludes credentials for normal queries
CREATE OR REPLACE VIEW public.radar_sources_safe AS 
SELECT 
  id,
  name,
  url,
  type,
  active,
  config,
  external_api_config,
  last_sync,
  created_at,
  updated_at,
  user_id,
  -- Show only if credentials exist (boolean), not the actual credentials
  CASE WHEN credentials IS NOT NULL THEN true ELSE false END as has_credentials
FROM public.radar_sources;

-- Enable RLS on the view
ALTER VIEW public.radar_sources_safe SET (security_barrier = true);

-- Grant access to the safe view
GRANT SELECT ON public.radar_sources_safe TO anon, authenticated;

-- Create RLS policies for the safe view
CREATE POLICY "Users can view their own sources (safe)" 
ON public.radar_sources_safe 
FOR SELECT 
USING (auth.uid() = user_id);

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

-- Revoke direct SELECT access to credentials column from the main table
-- Users should use the safe view instead
REVOKE SELECT(credentials) ON public.radar_sources FROM anon, authenticated;

-- Log this security enhancement
SELECT log_security_event('credentials_security_enhanced', null, 
  jsonb_build_object('action', 'revoked_credentials_select_access'));