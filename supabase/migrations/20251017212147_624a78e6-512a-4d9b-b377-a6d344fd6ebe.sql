-- Tabela para marcar itens excluídos permanentemente (não reimportar)
CREATE TABLE IF NOT EXISTS public.radar_tombstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  link TEXT NOT NULL,
  title TEXT,
  excluded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, link)
);

-- RLS para tombstones
ALTER TABLE public.radar_tombstones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tombstones"
  ON public.radar_tombstones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tombstones"
  ON public.radar_tombstones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índice para performance na checagem
CREATE INDEX IF NOT EXISTS idx_tombstones_user_link 
  ON public.radar_tombstones(user_id, link);