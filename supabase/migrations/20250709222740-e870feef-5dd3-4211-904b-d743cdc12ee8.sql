-- Corrigir a tabela radar_brasis para ter constraint UNIQUE no link
-- Isso permite o upsert funcionar corretamente na edge function

-- Primeiro, vamos remover duplicatas se existirem
DELETE FROM radar_brasis a USING radar_brasis b 
WHERE a.id < b.id AND a.link = b.link;

-- Adicionar constraint UNIQUE no campo link
ALTER TABLE radar_brasis ADD CONSTRAINT unique_radar_brasis_link UNIQUE (link);

-- Criar políticas temporárias para permitir que a edge function funcione
-- (estas políticas permitem acesso sem autenticação para a automação funcionar)

CREATE POLICY "Allow edge function access to radar_brasis" 
ON radar_brasis 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow edge function access to radar_sources" 
ON radar_sources 
FOR SELECT 
TO service_role 
USING (true);