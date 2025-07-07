-- Atualizar constraint de status para incluir novos valores
ALTER TABLE public.radar_brasis 
DROP CONSTRAINT IF EXISTS radar_brasis_status_check;

-- Criar nova constraint com todos os status válidos
ALTER TABLE public.radar_brasis 
ADD CONSTRAINT radar_brasis_status_check 
CHECK (status = ANY (ARRAY[
  'A curar'::text, 
  'Em aprovação'::text, 
  'Para Newsletter'::text,
  'Para Redes Sociais'::text,
  'Na Newsletter'::text,
  'Em edição'::text,
  'Pronto para distribuição'::text, 
  'Publicado'::text, 
  'Ignorado'::text
]));