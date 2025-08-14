-- Reverter mudanças de segurança complexas e simplificar radar_sources
-- Remover constraints e funções relacionadas à criptografia

-- 1. Remover constraint que força credentials = NULL (se existir)
ALTER TABLE radar_sources DROP CONSTRAINT IF EXISTS credentials_must_be_null;

-- 2. Remover trigger de criptografia (se existir) 
DROP TRIGGER IF EXISTS encrypt_credentials_trigger ON radar_sources;

-- 3. Remover funções de criptografia (se existirem)
DROP FUNCTION IF EXISTS encrypt_credentials();
DROP FUNCTION IF EXISTS decrypt_credentials(uuid);
DROP FUNCTION IF EXISTS get_radar_source_credentials(uuid);

-- 4. Remover coluna credentials_encrypted (se existir)
ALTER TABLE radar_sources DROP COLUMN IF EXISTS credentials_encrypted;

-- 5. Remover tabela de secrets (se existir)
DROP TABLE IF EXISTS app_secrets;

-- 6. Simplificar radar_sources - manter apenas campos essenciais
-- Adicionar campo external_api_config para configuração da API externa
ALTER TABLE radar_sources ADD COLUMN IF NOT EXISTS external_api_config jsonb DEFAULT NULL;

-- 7. Adicionar campo last_sync para controle de sincronização
ALTER TABLE radar_sources ADD COLUMN IF NOT EXISTS last_sync timestamp with time zone DEFAULT NULL;

-- 8. Comentário explicativo
COMMENT ON COLUMN radar_sources.external_api_config IS 'Configuração específica para integração com API externa de scraping';
COMMENT ON COLUMN radar_sources.last_sync IS 'Timestamp da última sincronização com a API externa';