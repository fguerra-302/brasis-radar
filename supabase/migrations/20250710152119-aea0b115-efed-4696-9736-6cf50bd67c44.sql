-- Migrar itens órfãos de "A curar" para "Em aprovação"
UPDATE radar_brasis 
SET status = 'Em aprovação', updated_at = now()
WHERE status = 'A curar';