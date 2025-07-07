-- Criar itens em diferentes etapas do fluxo para teste completo
-- Mover 2 itens para "Em aprovação"
UPDATE radar_brasis 
SET status = 'Em aprovação'
WHERE id IN (
  SELECT id FROM radar_brasis 
  WHERE status = 'Publicado' 
  ORDER BY created_at DESC
  LIMIT 2
);

-- Mover 2 itens para "Para Newsletter"
UPDATE radar_brasis 
SET status = 'Para Newsletter'
WHERE id IN (
  SELECT id FROM radar_brasis 
  WHERE status = 'Publicado' 
  ORDER BY created_at DESC
  LIMIT 2
);

-- Mover 2 itens para "Para Redes Sociais"
UPDATE radar_brasis 
SET status = 'Para Redes Sociais'
WHERE id IN (
  SELECT id FROM radar_brasis 
  WHERE status = 'Publicado' 
  ORDER BY created_at DESC
  LIMIT 2
);