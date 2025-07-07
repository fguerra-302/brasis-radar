-- Corrigir políticas RLS de segurança
-- 1. Primeiro, atribuir dados órfãos ao usuário admin
UPDATE public.radar_brasis 
SET user_id = (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1
) 
WHERE user_id IS NULL;

UPDATE public.radar_keywords 
SET user_id = (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1
) 
WHERE user_id IS NULL;

UPDATE public.radar_sources 
SET user_id = (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1
) 
WHERE user_id IS NULL;

-- 2. Remover políticas inseguras existentes
DROP POLICY "Users can view their own radar items" ON public.radar_brasis;
DROP POLICY "Users can insert their own radar items" ON public.radar_brasis;
DROP POLICY "Users can update their own radar items" ON public.radar_brasis;
DROP POLICY "Users can delete their own radar items" ON public.radar_brasis;

DROP POLICY "Users can view their own keywords" ON public.radar_keywords;
DROP POLICY "Users can insert their own keywords" ON public.radar_keywords;
DROP POLICY "Users can update their own keywords" ON public.radar_keywords;
DROP POLICY "Users can delete their own keywords" ON public.radar_keywords;

DROP POLICY "Users can view their own sources" ON public.radar_sources;
DROP POLICY "Users can insert their own sources" ON public.radar_sources;
DROP POLICY "Users can update their own sources" ON public.radar_sources;
DROP POLICY "Users can delete their own sources" ON public.radar_sources;

-- 3. Criar políticas seguras para radar_brasis
CREATE POLICY "Users can view their own radar items" 
ON public.radar_brasis 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own radar items" 
ON public.radar_brasis 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own radar items" 
ON public.radar_brasis 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own radar items" 
ON public.radar_brasis 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Criar políticas seguras para radar_keywords
CREATE POLICY "Users can view their own keywords" 
ON public.radar_keywords 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords" 
ON public.radar_keywords 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords" 
ON public.radar_keywords 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords" 
ON public.radar_keywords 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Criar políticas seguras para radar_sources
CREATE POLICY "Users can view their own sources" 
ON public.radar_sources 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources" 
ON public.radar_sources 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources" 
ON public.radar_sources 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources" 
ON public.radar_sources 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 6. Tornar user_id obrigatório (não nulo) para evitar dados órfãos futuros
ALTER TABLE public.radar_brasis ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.radar_keywords ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.radar_sources ALTER COLUMN user_id SET NOT NULL;