-- Mover alguns itens publicados para o fluxo de curadoria para teste
UPDATE radar_brasis 
SET status = 'A curar'
WHERE status = 'Publicado' 
AND created_at >= '2025-07-07 15:00:00'
LIMIT 5;

-- Criar alguns itens em diferentes etapas do fluxo para teste
UPDATE radar_brasis 
SET status = 'Em aprovação'
WHERE status = 'Publicado' 
AND created_at >= '2025-07-07 14:00:00'
AND created_at < '2025-07-07 15:00:00'
LIMIT 3;

UPDATE radar_brasis 
SET status = 'Para Newsletter'
WHERE status = 'Publicado' 
AND created_at >= '2025-07-07 13:00:00'
AND created_at < '2025-07-07 14:00:00'
LIMIT 2;

UPDATE radar_brasis 
SET status = 'Para Redes Sociais'
WHERE status = 'Publicado' 
AND created_at >= '2025-07-07 12:00:00'
AND created_at < '2025-07-07 13:00:00'
LIMIT 2;