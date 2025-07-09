-- Criar um usuário padrão no sistema para automação
-- Isso resolve o problema do defaultUserId nas edge functions

-- Inserir um usuário padrão para o sistema (se não existir)
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'sistema@brasis.ai',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Criar role padrão para esse usuário
INSERT INTO user_roles (user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000000', 'admin') 
ON CONFLICT (user_id, role) DO NOTHING;