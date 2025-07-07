-- Simplificar fluxo: eliminar status "A curar" 
-- Atualizar itens existentes de "A curar" para "Em aprovação"
UPDATE public.radar_brasis 
SET status = 'Em aprovação' 
WHERE status = 'A curar';

-- Atualizar constraint do status se existir
-- (removendo "A curar" das opções válidas)