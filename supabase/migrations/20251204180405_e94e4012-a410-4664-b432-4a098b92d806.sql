-- Tabela de grupos de conteúdo (produtos/newsletters)
CREATE TABLE public.content_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Tabela de associação fonte-grupo (muitos-para-muitos)
CREATE TABLE public.source_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_id UUID NOT NULL REFERENCES public.radar_sources(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.content_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source_id, group_id)
);

-- Adicionar coluna group_id na tabela radar_brasis
ALTER TABLE public.radar_brasis 
ADD COLUMN group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.content_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_group_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para content_groups
CREATE POLICY "Users can view their own groups"
ON public.content_groups FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own groups"
ON public.content_groups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
ON public.content_groups FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
ON public.content_groups FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para source_group_assignments
CREATE POLICY "Users can view their own assignments"
ON public.source_group_assignments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments"
ON public.source_group_assignments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments"
ON public.source_group_assignments FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_content_groups_updated_at
BEFORE UPDATE ON public.content_groups
FOR EACH ROW
EXECUTE FUNCTION public.audit_updated_at();

-- Índices para performance
CREATE INDEX idx_content_groups_user_id ON public.content_groups(user_id);
CREATE INDEX idx_source_group_assignments_user_id ON public.source_group_assignments(user_id);
CREATE INDEX idx_source_group_assignments_source_id ON public.source_group_assignments(source_id);
CREATE INDEX idx_source_group_assignments_group_id ON public.source_group_assignments(group_id);
CREATE INDEX idx_radar_brasis_group_id ON public.radar_brasis(group_id);