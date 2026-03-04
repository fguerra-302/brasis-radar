ALTER TABLE public.radar_brasis DROP CONSTRAINT radar_brasis_status_check;

ALTER TABLE public.radar_brasis ADD CONSTRAINT radar_brasis_status_check 
CHECK (status = ANY (ARRAY[
  'Coletado'::text,
  'A curar'::text,
  'Em aprovação'::text, 
  'Para Newsletter'::text, 
  'Para Redes Sociais'::text, 
  'Em edição'::text, 
  'Publicado'::text, 
  'Ignorado'::text
]));