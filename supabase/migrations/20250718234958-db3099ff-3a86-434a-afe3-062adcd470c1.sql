
-- CORREÇÃO CRÍTICA 1: Reativar RLS e corrigir políticas de segurança

-- 1. Reativar RLS em todas as tabelas (que foram desabilitadas temporariamente)
ALTER TABLE public.radar_brasis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_keywords ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas permissivas perigosas
DROP POLICY IF EXISTS "Allow edge function access to radar_brasis" ON public.radar_brasis;
DROP POLICY IF EXISTS "Allow edge function access to radar_sources" ON public.radar_sources;

-- 3. Garantir que as políticas corretas estão ativas
-- Para radar_brasis
DO $$
BEGIN
    -- Verificar e criar política de SELECT se não existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can view their own radar items'
    ) THEN
        CREATE POLICY "Users can view their own radar items" 
        ON public.radar_brasis 
        FOR SELECT 
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- Verificar e criar política de INSERT se não existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can insert their own radar items'
    ) THEN
        CREATE POLICY "Users can insert their own radar items" 
        ON public.radar_brasis 
        FOR INSERT 
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Verificar e criar política de UPDATE se não existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can update their own radar items'
    ) THEN
        CREATE POLICY "Users can update their own radar items" 
        ON public.radar_brasis 
        FOR UPDATE 
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Verificar e criar política de DELETE se não existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can delete their own radar items'
    ) THEN
        CREATE POLICY "Users can delete their own radar items" 
        ON public.radar_brasis 
        FOR DELETE 
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 4. Reativar foreign key constraints que foram removidas
-- Primeiro verificar se as constraints existem antes de tentar recriar
DO $$
BEGIN
    -- Recriar constraint de user_id na tabela radar_sources se não existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'radar_sources_user_id_fkey' 
        AND table_name = 'radar_sources'
    ) THEN
        ALTER TABLE public.radar_sources 
        ADD CONSTRAINT radar_sources_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Recriar constraint de user_id na tabela radar_keywords se não existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'radar_keywords_user_id_fkey' 
        AND table_name = 'radar_keywords'
    ) THEN
        ALTER TABLE public.radar_keywords 
        ADD CONSTRAINT radar_keywords_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Recriar constraint de user_id na tabela radar_brasis se não existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'radar_brasis_user_id_fkey' 
        AND table_name = 'radar_brasis'
    ) THEN
        ALTER TABLE public.radar_brasis 
        ADD CONSTRAINT radar_brasis_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- 5. Criar tabela para configurações de branding do usuário
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT DEFAULT 'DNA Brasis',
    company_description TEXT DEFAULT 'Sistema de curadoria de conteúdo',
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#dc2626',
    newsletter_signature TEXT DEFAULT 'Equipe DNA Brasis',
    newsletter_footer TEXT DEFAULT 'Este conteúdo foi curado especialmente para você.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- 6. Habilitar RLS na tabela user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para user_settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_status ON public.radar_brasis(status);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_created_at ON public.radar_brasis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_sources_active ON public.radar_sources(active) WHERE active = true;

-- 9. Criar trigger para atualizar updated_at na user_settings
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();
