-- Atualizar a tabela radar_brasis para incluir novos status do fluxo de curadoria
ALTER TABLE radar_brasis DROP CONSTRAINT IF EXISTS radar_brasis_status_check;

ALTER TABLE radar_brasis ADD CONSTRAINT radar_brasis_status_check 
CHECK (status IN ('A curar', 'Em aprovação', 'Em edição', 'Pronto para distribuição', 'Publicado', 'Ignorado'));