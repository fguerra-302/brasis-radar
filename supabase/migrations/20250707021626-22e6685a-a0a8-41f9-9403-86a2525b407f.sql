-- Dar permissões de admin para o usuário existente
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'fguerra@somosbrasis.com.br';