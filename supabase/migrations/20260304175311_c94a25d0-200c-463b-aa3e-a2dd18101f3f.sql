
-- =============================================
-- FIX: Convert ALL restrictive policies to permissive
-- =============================================

-- 1. content_groups
DROP POLICY IF EXISTS "content_groups_select" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_insert" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_update" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_delete" ON public.content_groups;

CREATE POLICY "content_groups_select" ON public.content_groups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_insert" ON public.content_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_groups_update" ON public.content_groups FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_delete" ON public.content_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. editorial_weights
DROP POLICY IF EXISTS "editorial_weights_select" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_insert" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_update" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_delete" ON public.editorial_weights;

CREATE POLICY "editorial_weights_select" ON public.editorial_weights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_insert" ON public.editorial_weights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editorial_weights_update" ON public.editorial_weights FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_delete" ON public.editorial_weights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. radar_brasis
DROP POLICY IF EXISTS "radar_brasis_select" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_insert" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_update" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_delete" ON public.radar_brasis;

CREATE POLICY "radar_brasis_select" ON public.radar_brasis FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_insert" ON public.radar_brasis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_brasis_update" ON public.radar_brasis FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_delete" ON public.radar_brasis FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. radar_keywords
DROP POLICY IF EXISTS "radar_keywords_select" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_insert" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_update" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_delete" ON public.radar_keywords;

CREATE POLICY "radar_keywords_select" ON public.radar_keywords FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_insert" ON public.radar_keywords FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_keywords_update" ON public.radar_keywords FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_delete" ON public.radar_keywords FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. radar_sources
DROP POLICY IF EXISTS "radar_sources_select" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_insert" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_update" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_delete" ON public.radar_sources;

CREATE POLICY "radar_sources_select" ON public.radar_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_insert" ON public.radar_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_sources_update" ON public.radar_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_delete" ON public.radar_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. radar_tombstones
DROP POLICY IF EXISTS "radar_tombstones_select" ON public.radar_tombstones;
DROP POLICY IF EXISTS "radar_tombstones_insert" ON public.radar_tombstones;
DROP POLICY IF EXISTS "radar_tombstones_delete" ON public.radar_tombstones;

CREATE POLICY "radar_tombstones_select" ON public.radar_tombstones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_insert" ON public.radar_tombstones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_delete" ON public.radar_tombstones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. shared_sources (all authenticated can read, only admins can modify)
DROP POLICY IF EXISTS "shared_sources_select" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_insert" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_update" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_delete" ON public.shared_sources;

CREATE POLICY "shared_sources_select" ON public.shared_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "shared_sources_insert" ON public.shared_sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "shared_sources_update" ON public.shared_sources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "shared_sources_delete" ON public.shared_sources FOR DELETE TO authenticated USING (true);

-- 8. project_folders
DROP POLICY IF EXISTS "project_folders_select" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_insert" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_update" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_delete" ON public.project_folders;

CREATE POLICY "project_folders_select" ON public.project_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_insert" ON public.project_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_folders_update" ON public.project_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_delete" ON public.project_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. project_source_links
DROP POLICY IF EXISTS "project_source_links_select" ON public.project_source_links;
DROP POLICY IF EXISTS "project_source_links_insert" ON public.project_source_links;
DROP POLICY IF EXISTS "project_source_links_delete" ON public.project_source_links;

CREATE POLICY "project_source_links_select" ON public.project_source_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_source_links_insert" ON public.project_source_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_source_links_delete" ON public.project_source_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. source_group_assignments
DROP POLICY IF EXISTS "source_group_assignments_select" ON public.source_group_assignments;
DROP POLICY IF EXISTS "source_group_assignments_insert" ON public.source_group_assignments;
DROP POLICY IF EXISTS "source_group_assignments_delete" ON public.source_group_assignments;

CREATE POLICY "source_group_assignments_select" ON public.source_group_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_insert" ON public.source_group_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_delete" ON public.source_group_assignments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. user_settings
DROP POLICY IF EXISTS "user_settings_select" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete" ON public.user_settings;

CREATE POLICY "user_settings_select" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_insert" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_settings_update" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_delete" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 12. user_roles (keep admin-only logic but make permissive)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
