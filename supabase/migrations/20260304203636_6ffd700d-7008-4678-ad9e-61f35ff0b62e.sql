
-- Fix the unique constraint: drop constraint (not index), then create scoped one
ALTER TABLE public.radar_sources DROP CONSTRAINT IF EXISTS radar_sources_name_unique;
CREATE UNIQUE INDEX IF NOT EXISTS radar_sources_user_name_unique ON public.radar_sources (user_id, name);
