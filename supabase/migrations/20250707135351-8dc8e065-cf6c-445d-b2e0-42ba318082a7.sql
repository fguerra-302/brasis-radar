-- Adicionar user_id às tabelas para curadoria individual por usuário
ALTER TABLE public.radar_brasis 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.radar_sources 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.radar_keywords 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar políticas RLS para filtrar por usuário
DROP POLICY IF EXISTS "Users can view all radar items" ON public.radar_brasis;
DROP POLICY IF EXISTS "Authenticated users can insert radar items" ON public.radar_brasis;
DROP POLICY IF EXISTS "Authenticated users can update radar items" ON public.radar_brasis;
DROP POLICY IF EXISTS "Authenticated users can delete radar items" ON public.radar_brasis;

-- Novas políticas para radar_brasis com isolamento por usuário
CREATE POLICY "Users can view their own radar items" 
ON public.radar_brasis 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL); -- NULL para dados existentes

CREATE POLICY "Users can insert their own radar items" 
ON public.radar_brasis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own radar items" 
ON public.radar_brasis 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own radar items" 
ON public.radar_brasis 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Atualizar políticas para radar_sources
DROP POLICY IF EXISTS "Users can view all sources" ON public.radar_sources;
DROP POLICY IF EXISTS "Authenticated users can manage sources" ON public.radar_sources;
DROP POLICY IF EXISTS "Authenticated users can update sources" ON public.radar_sources;
DROP POLICY IF EXISTS "Authenticated users can delete sources" ON public.radar_sources;

CREATE POLICY "Users can view their own sources" 
ON public.radar_sources 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own sources" 
ON public.radar_sources 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources" 
ON public.radar_sources 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own sources" 
ON public.radar_sources 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Atualizar políticas para radar_keywords
DROP POLICY IF EXISTS "Users can view all keywords" ON public.radar_keywords;
DROP POLICY IF EXISTS "Authenticated users can manage keywords" ON public.radar_keywords;
DROP POLICY IF EXISTS "Authenticated users can update keywords" ON public.radar_keywords;
DROP POLICY IF EXISTS "Authenticated users can delete keywords" ON public.radar_keywords;

CREATE POLICY "Users can view their own keywords" 
ON public.radar_keywords 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own keywords" 
ON public.radar_keywords 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords" 
ON public.radar_keywords 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own keywords" 
ON public.radar_keywords 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Função para migrar dados existentes para o usuário admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar o primeiro usuário admin
  SELECT ur.user_id INTO admin_user_id
  FROM public.user_roles ur 
  WHERE ur.role = 'admin'::app_role 
  LIMIT 1;
  
  -- Se existe usuário admin, associar dados existentes a ele
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.radar_brasis 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    
    UPDATE public.radar_sources 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    
    UPDATE public.radar_keywords 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
  END IF;
END $$;