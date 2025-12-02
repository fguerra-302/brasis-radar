-- Remove política de demo que permite acesso anônimo
DROP POLICY IF EXISTS "Anonymous users can read demo radar items" ON public.radar_brasis;