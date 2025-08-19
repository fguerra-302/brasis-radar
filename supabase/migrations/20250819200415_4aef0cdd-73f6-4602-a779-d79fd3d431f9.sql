-- Add RLS policy for anonymous users to read demo content
CREATE POLICY "Anonymous users can read demo radar items" 
ON public.radar_brasis 
FOR SELECT 
TO anon
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Insert some demo content if it doesn't exist
INSERT INTO public.radar_brasis (
  user_id, 
  title, 
  link, 
  source, 
  pub_date, 
  editoria, 
  status, 
  resumo_curado,
  tags
) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  title,
  link || '-demo', -- Avoid unique constraint conflicts
  source,
  pub_date,
  editoria,
  'Aprovado',
  resumo_curado,
  tags
FROM public.radar_brasis 
WHERE created_at >= NOW() - INTERVAL '7 days'
AND user_id != '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at DESC
LIMIT 10
ON CONFLICT (link) DO NOTHING;