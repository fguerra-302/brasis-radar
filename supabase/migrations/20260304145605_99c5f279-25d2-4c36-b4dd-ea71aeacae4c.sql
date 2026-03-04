
-- Fix ALL restrictive policies across ALL tables to be PERMISSIVE

-- ========== shared_sources ==========
DROP POLICY IF EXISTS "Authenticated users can view all shared sources" ON public.shared_sources;
DROP POLICY IF EXISTS "Authenticated users can insert shared sources" ON public.shared_sources;
DROP POLICY IF EXISTS "Authenticated users can update shared sources" ON public.shared_sources;
DROP POLICY IF EXISTS "Authenticated users can delete shared sources" ON public.shared_sources;

CREATE POLICY "shared_sources_select" ON public.shared_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "shared_sources_insert" ON public.shared_sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "shared_sources_update" ON public.shared_sources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "shared_sources_delete" ON public.shared_sources FOR DELETE TO authenticated USING (true);

-- ========== project_folders ==========
DROP POLICY IF EXISTS "Users can view their own folders" ON public.project_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.project_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.project_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.project_folders;

CREATE POLICY "project_folders_select" ON public.project_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_insert" ON public.project_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_folders_update" ON public.project_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_delete" ON public.project_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== project_source_links ==========
DROP POLICY IF EXISTS "Users can view their own links" ON public.project_source_links;
DROP POLICY IF EXISTS "Users can insert their own links" ON public.project_source_links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.project_source_links;

CREATE POLICY "project_source_links_select" ON public.project_source_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_source_links_insert" ON public.project_source_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_source_links_delete" ON public.project_source_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== content_groups ==========
DROP POLICY IF EXISTS "Users can view their own groups" ON public.content_groups;
DROP POLICY IF EXISTS "Users can insert their own groups" ON public.content_groups;
DROP POLICY IF EXISTS "Users can update their own groups" ON public.content_groups;
DROP POLICY IF EXISTS "Users can delete their own groups" ON public.content_groups;

CREATE POLICY "content_groups_select" ON public.content_groups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_insert" ON public.content_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_groups_update" ON public.content_groups FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_delete" ON public.content_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== editorial_weights ==========
DROP POLICY IF EXISTS "Users can view their own editorial weights" ON public.editorial_weights;
DROP POLICY IF EXISTS "Users can insert their own editorial weights" ON public.editorial_weights;
DROP POLICY IF EXISTS "Users can update their own editorial weights" ON public.editorial_weights;
DROP POLICY IF EXISTS "Users can delete their own editorial weights" ON public.editorial_weights;

CREATE POLICY "editorial_weights_select" ON public.editorial_weights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_insert" ON public.editorial_weights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editorial_weights_update" ON public.editorial_weights FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_delete" ON public.editorial_weights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== radar_brasis ==========
DROP POLICY IF EXISTS "Users can view their own content" ON public.radar_brasis;
DROP POLICY IF EXISTS "Users can insert their own content" ON public.radar_brasis;
DROP POLICY IF EXISTS "Users can update their own content" ON public.radar_brasis;
DROP POLICY IF EXISTS "Users can delete their own content" ON public.radar_brasis;
DROP POLICY IF EXISTS "Users can view their own radar items" ON public.radar_brasis;
DROP POLICY IF EXISTS "Users can insert their own radar items" ON public.radar_brasis;
DROP POLICY IF EXISTS "Users can update their own radar items" ON public.radar_brasis;
DROP POLICY IF EXISTS "Users can delete their own radar items" ON public.radar_brasis;

CREATE POLICY "radar_brasis_select" ON public.radar_brasis FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_insert" ON public.radar_brasis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_brasis_update" ON public.radar_brasis FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_delete" ON public.radar_brasis FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== radar_keywords ==========
DROP POLICY IF EXISTS "Users can view their own keywords" ON public.radar_keywords;
DROP POLICY IF EXISTS "Users can insert their own keywords" ON public.radar_keywords;
DROP POLICY IF EXISTS "Users can update their own keywords" ON public.radar_keywords;
DROP POLICY IF EXISTS "Users can delete their own keywords" ON public.radar_keywords;

CREATE POLICY "radar_keywords_select" ON public.radar_keywords FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_insert" ON public.radar_keywords FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_keywords_update" ON public.radar_keywords FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_delete" ON public.radar_keywords FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== radar_sources ==========
DROP POLICY IF EXISTS "Users can view their own sources" ON public.radar_sources;
DROP POLICY IF EXISTS "Users can insert their own sources" ON public.radar_sources;
DROP POLICY IF EXISTS "Users can update their own sources" ON public.radar_sources;
DROP POLICY IF EXISTS "Users can delete their own sources" ON public.radar_sources;

CREATE POLICY "radar_sources_select" ON public.radar_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_insert" ON public.radar_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_sources_update" ON public.radar_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_delete" ON public.radar_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== radar_tombstones ==========
DROP POLICY IF EXISTS "Users can view their own tombstones" ON public.radar_tombstones;
DROP POLICY IF EXISTS "Users can insert their own tombstones" ON public.radar_tombstones;
DROP POLICY IF EXISTS "Users can delete their own tombstones" ON public.radar_tombstones;

CREATE POLICY "radar_tombstones_select" ON public.radar_tombstones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_insert" ON public.radar_tombstones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_delete" ON public.radar_tombstones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== source_group_assignments ==========
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.source_group_assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON public.source_group_assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON public.source_group_assignments;

CREATE POLICY "source_group_assignments_select" ON public.source_group_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_insert" ON public.source_group_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_delete" ON public.source_group_assignments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== user_settings ==========
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

CREATE POLICY "user_settings_select" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_insert" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_settings_update" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_delete" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
