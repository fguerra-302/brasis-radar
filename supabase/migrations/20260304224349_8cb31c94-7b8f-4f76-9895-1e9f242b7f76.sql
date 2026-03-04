DROP POLICY IF EXISTS shared_sources_insert ON public.shared_sources;
DROP POLICY IF EXISTS shared_sources_update ON public.shared_sources;
DROP POLICY IF EXISTS shared_sources_delete ON public.shared_sources;

CREATE POLICY shared_sources_insert ON public.shared_sources
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY shared_sources_update ON public.shared_sources
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY shared_sources_delete ON public.shared_sources
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));