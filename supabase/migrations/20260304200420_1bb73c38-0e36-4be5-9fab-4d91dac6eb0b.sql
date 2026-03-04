
-- ============================================
-- FIX DEFINITIVO: Todas as policies PERMISSIVE
-- ============================================

-- 1. brasis_content
DROP POLICY IF EXISTS "brasis_content_select" ON public.brasis_content;
DROP POLICY IF EXISTS "brasis_content_insert" ON public.brasis_content;
DROP POLICY IF EXISTS "brasis_content_update" ON public.brasis_content;
DROP POLICY IF EXISTS "brasis_content_delete" ON public.brasis_content;
DROP POLICY IF EXISTS "Users manage own content" ON public.brasis_content;

CREATE POLICY "brasis_content_select" ON public.brasis_content FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "brasis_content_insert" ON public.brasis_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "brasis_content_update" ON public.brasis_content FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "brasis_content_delete" ON public.brasis_content FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. radar_brasis
DROP POLICY IF EXISTS "radar_brasis_select" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_insert" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_update" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_delete" ON public.radar_brasis;

CREATE POLICY "radar_brasis_select" ON public.radar_brasis FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_insert" ON public.radar_brasis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_brasis_update" ON public.radar_brasis FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_delete" ON public.radar_brasis FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. radar_keywords
DROP POLICY IF EXISTS "radar_keywords_select" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_insert" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_update" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_delete" ON public.radar_keywords;

CREATE POLICY "radar_keywords_select" ON public.radar_keywords FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_insert" ON public.radar_keywords FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_keywords_update" ON public.radar_keywords FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_delete" ON public.radar_keywords FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. radar_sources
DROP POLICY IF EXISTS "radar_sources_select" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_insert" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_update" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_delete" ON public.radar_sources;

CREATE POLICY "radar_sources_select" ON public.radar_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_insert" ON public.radar_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_sources_update" ON public.radar_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_delete" ON public.radar_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. radar_tombstones
DROP POLICY IF EXISTS "radar_tombstones_select" ON public.radar_tombstones;
DROP POLICY IF EXISTS "radar_tombstones_insert" ON public.radar_tombstones;
DROP POLICY IF EXISTS "radar_tombstones_delete" ON public.radar_tombstones;

CREATE POLICY "radar_tombstones_select" ON public.radar_tombstones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_insert" ON public.radar_tombstones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_delete" ON public.radar_tombstones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. content_groups
DROP POLICY IF EXISTS "content_groups_select" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_insert" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_update" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_delete" ON public.content_groups;

CREATE POLICY "content_groups_select" ON public.content_groups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_insert" ON public.content_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_groups_update" ON public.content_groups FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_delete" ON public.content_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. editorial_weights
DROP POLICY IF EXISTS "editorial_weights_select" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_insert" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_update" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_delete" ON public.editorial_weights;

CREATE POLICY "editorial_weights_select" ON public.editorial_weights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_insert" ON public.editorial_weights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editorial_weights_update" ON public.editorial_weights FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_delete" ON public.editorial_weights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. user_settings
DROP POLICY IF EXISTS "user_settings_select" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete" ON public.user_settings;

CREATE POLICY "user_settings_select" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_insert" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_settings_update" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_delete" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. project_folders
DROP POLICY IF EXISTS "project_folders_select" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_insert" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_update" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_delete" ON public.project_folders;

CREATE POLICY "project_folders_select" ON public.project_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_insert" ON public.project_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_folders_update" ON public.project_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_delete" ON public.project_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. project_source_links
DROP POLICY IF EXISTS "project_source_links_select" ON public.project_source_links;
DROP POLICY IF EXISTS "project_source_links_insert" ON public.project_source_links;
DROP POLICY IF EXISTS "project_source_links_delete" ON public.project_source_links;

CREATE POLICY "project_source_links_select" ON public.project_source_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_source_links_insert" ON public.project_source_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_source_links_delete" ON public.project_source_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. source_group_assignments
DROP POLICY IF EXISTS "source_group_assignments_select" ON public.source_group_assignments;
DROP POLICY IF EXISTS "source_group_assignments_insert" ON public.source_group_assignments;
DROP POLICY IF EXISTS "source_group_assignments_delete" ON public.source_group_assignments;

CREATE POLICY "source_group_assignments_select" ON public.source_group_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_insert" ON public.source_group_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_delete" ON public.source_group_assignments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 12. shared_sources (usa USING true para recursos compartilhados)
DROP POLICY IF EXISTS "shared_sources_select" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_insert" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_update" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_delete" ON public.shared_sources;

CREATE POLICY "shared_sources_select" ON public.shared_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "shared_sources_insert" ON public.shared_sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "shared_sources_update" ON public.shared_sources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "shared_sources_delete" ON public.shared_sources FOR DELETE TO authenticated USING (true);

-- ============================================
-- CRIAR TABELA PERSONAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  tone text NOT NULL DEFAULT 'professional',
  style text NOT NULL DEFAULT 'informative',
  target_audience text,
  key_values text,
  communication_style text,
  examples text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personas_select" ON public.personas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "personas_insert" ON public.personas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personas_update" ON public.personas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "personas_delete" ON public.personas FOR DELETE TO authenticated USING (auth.uid() = user_id);
