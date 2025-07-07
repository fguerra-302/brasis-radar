-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- Reativar Row Level Security em todas as tabelas principais

-- 1. Verificar e reativar RLS nas tabelas principais
ALTER TABLE public.radar_brasis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Verificar se as políticas RLS existem, se não, criar
-- Políticas para radar_brasis
DO $$
BEGIN
    -- Verificar se a política de SELECT existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can view their own radar items'
    ) THEN
        CREATE POLICY "Users can view their own radar items" 
        ON public.radar_brasis 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    -- Verificar se a política de INSERT existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can insert their own radar items'
    ) THEN
        CREATE POLICY "Users can insert their own radar items" 
        ON public.radar_brasis 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Verificar se a política de UPDATE existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can update their own radar items'
    ) THEN
        CREATE POLICY "Users can update their own radar items" 
        ON public.radar_brasis 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    -- Verificar se a política de DELETE existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_brasis' 
        AND policyname = 'Users can delete their own radar items'
    ) THEN
        CREATE POLICY "Users can delete their own radar items" 
        ON public.radar_brasis 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 3. Políticas para radar_sources
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_sources' 
        AND policyname = 'Users can view their own sources'
    ) THEN
        CREATE POLICY "Users can view their own sources" 
        ON public.radar_sources 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_sources' 
        AND policyname = 'Users can insert their own sources'
    ) THEN
        CREATE POLICY "Users can insert their own sources" 
        ON public.radar_sources 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_sources' 
        AND policyname = 'Users can update their own sources'
    ) THEN
        CREATE POLICY "Users can update their own sources" 
        ON public.radar_sources 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_sources' 
        AND policyname = 'Users can delete their own sources'
    ) THEN
        CREATE POLICY "Users can delete their own sources" 
        ON public.radar_sources 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 4. Políticas para radar_keywords
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_keywords' 
        AND policyname = 'Users can view their own keywords'
    ) THEN
        CREATE POLICY "Users can view their own keywords" 
        ON public.radar_keywords 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_keywords' 
        AND policyname = 'Users can insert their own keywords'
    ) THEN
        CREATE POLICY "Users can insert their own keywords" 
        ON public.radar_keywords 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_keywords' 
        AND policyname = 'Users can update their own keywords'
    ) THEN
        CREATE POLICY "Users can update their own keywords" 
        ON public.radar_keywords 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'radar_keywords' 
        AND policyname = 'Users can delete their own keywords'
    ) THEN
        CREATE POLICY "Users can delete their own keywords" 
        ON public.radar_keywords 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 5. Tornar user_id NOT NULL nas tabelas onde apropriado
-- (fazer isso gradualmente para evitar quebrar dados existentes)
-- Por enquanto, vamos apenas marcar como NOT NULL onde já está
ALTER TABLE public.radar_brasis ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.radar_sources ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.radar_keywords ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN user_id SET NOT NULL;

-- 6. Criar índices para melhor performance das políticas RLS
CREATE INDEX IF NOT EXISTS idx_radar_brasis_user_id ON public.radar_brasis(user_id);
CREATE INDEX IF NOT EXISTS idx_radar_sources_user_id ON public.radar_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_radar_keywords_user_id ON public.radar_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 7. Adicionar trigger de auditoria para changes importantes
CREATE OR REPLACE FUNCTION public.audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de auditoria onde aplicável
DROP TRIGGER IF EXISTS update_radar_brasis_updated_at ON public.radar_brasis;
CREATE TRIGGER update_radar_brasis_updated_at
    BEFORE UPDATE ON public.radar_brasis
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

DROP TRIGGER IF EXISTS update_radar_sources_updated_at ON public.radar_sources;
CREATE TRIGGER update_radar_sources_updated_at
    BEFORE UPDATE ON public.radar_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();

DROP TRIGGER IF EXISTS update_radar_keywords_updated_at ON public.radar_keywords;
CREATE TRIGGER update_radar_keywords_updated_at
    BEFORE UPDATE ON public.radar_keywords
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_updated_at();