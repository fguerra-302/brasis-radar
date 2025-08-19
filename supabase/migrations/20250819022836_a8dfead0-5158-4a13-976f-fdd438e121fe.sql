-- Add updated_at triggers for all main tables
-- These triggers will automatically update the updated_at column when records are modified

-- Trigger for radar_brasis table
CREATE TRIGGER update_radar_brasis_updated_at
  BEFORE UPDATE ON public.radar_brasis
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_updated_at();

-- Trigger for radar_sources table  
CREATE TRIGGER update_radar_sources_updated_at
  BEFORE UPDATE ON public.radar_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_updated_at();

-- Trigger for radar_keywords table
CREATE TRIGGER update_radar_keywords_updated_at
  BEFORE UPDATE ON public.radar_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_updated_at();

-- Trigger for user_settings table
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_updated_at();