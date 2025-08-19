-- 1. Improve user_roles RLS policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create explicit policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add updated_at triggers to key tables
CREATE TRIGGER update_radar_brasis_updated_at
    BEFORE UPDATE ON public.radar_brasis
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER update_radar_sources_updated_at
    BEFORE UPDATE ON public.radar_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER update_radar_keywords_updated_at
    BEFORE UPDATE ON public.radar_keywords
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

-- 3. Secure emergency functions (revoke from public, grant only to service roles)
REVOKE ALL ON FUNCTION public.emergency_disable_all_rls() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.emergency_disable_rls_brasis() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.emergency_disable_rls_sources() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.emergency_disable_rls_keywords() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.emergency_disable_all_rls() TO postgres;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_brasis() TO postgres;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_sources() TO postgres;
GRANT EXECUTE ON FUNCTION public.emergency_disable_rls_keywords() TO postgres;