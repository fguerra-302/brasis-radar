-- FASE 1: CORREÇÃO DE STATUS
-- Atualizar "A curar" para "Em aprovação" para sincronizar com o enum
UPDATE radar_brasis 
SET status = 'Em aprovação'
WHERE status = 'A curar';

-- FASE 2: ASSOCIAÇÃO DE DADOS ÓRFÃOS
-- Atualizar registros com user_id nulo para o primeiro usuário (temporário)
-- Em produção, isso seria feito com o usuário autenticado
UPDATE radar_brasis 
SET user_id = (
  SELECT id FROM auth.users LIMIT 1
)
WHERE user_id IS NULL;

-- Criar configurações padrão de usuário
INSERT INTO user_settings (
  user_id,
  company_name,
  company_description,
  primary_color,
  secondary_color,
  newsletter_signature,
  newsletter_footer
)
SELECT 
  id,
  'DNA Brasis',
  'Sistema de curadoria de conteúdo',
  '#2563eb',
  '#dc2626',
  'Equipe DNA Brasis',
  'Este conteúdo foi curado especialmente para você.'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;