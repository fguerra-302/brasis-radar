
-- ITEM 1: Fix ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE

-- brasis_content
DROP POLICY IF EXISTS "brasis_content_select" ON public.brasis_content;
DROP POLICY IF EXISTS "brasis_content_insert" ON public.brasis_content;
DROP POLICY IF EXISTS "brasis_content_update" ON public.brasis_content;
DROP POLICY IF EXISTS "brasis_content_delete" ON public.brasis_content;

CREATE POLICY "brasis_content_select" ON public.brasis_content AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "brasis_content_insert" ON public.brasis_content AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "brasis_content_update" ON public.brasis_content AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "brasis_content_delete" ON public.brasis_content AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- content_groups
DROP POLICY IF EXISTS "content_groups_select" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_insert" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_update" ON public.content_groups;
DROP POLICY IF EXISTS "content_groups_delete" ON public.content_groups;

CREATE POLICY "content_groups_select" ON public.content_groups AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_insert" ON public.content_groups AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_groups_update" ON public.content_groups AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "content_groups_delete" ON public.content_groups AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- editorial_weights
DROP POLICY IF EXISTS "editorial_weights_select" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_insert" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_update" ON public.editorial_weights;
DROP POLICY IF EXISTS "editorial_weights_delete" ON public.editorial_weights;

CREATE POLICY "editorial_weights_select" ON public.editorial_weights AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_insert" ON public.editorial_weights AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editorial_weights_update" ON public.editorial_weights AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "editorial_weights_delete" ON public.editorial_weights AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- personas
DROP POLICY IF EXISTS "personas_select" ON public.personas;
DROP POLICY IF EXISTS "personas_insert" ON public.personas;
DROP POLICY IF EXISTS "personas_update" ON public.personas;
DROP POLICY IF EXISTS "personas_delete" ON public.personas;

CREATE POLICY "personas_select" ON public.personas AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "personas_insert" ON public.personas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personas_update" ON public.personas AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "personas_delete" ON public.personas AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- project_folders
DROP POLICY IF EXISTS "project_folders_select" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_insert" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_update" ON public.project_folders;
DROP POLICY IF EXISTS "project_folders_delete" ON public.project_folders;

CREATE POLICY "project_folders_select" ON public.project_folders AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_insert" ON public.project_folders AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_folders_update" ON public.project_folders AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_folders_delete" ON public.project_folders AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- project_source_links
DROP POLICY IF EXISTS "project_source_links_select" ON public.project_source_links;
DROP POLICY IF EXISTS "project_source_links_insert" ON public.project_source_links;
DROP POLICY IF EXISTS "project_source_links_delete" ON public.project_source_links;

CREATE POLICY "project_source_links_select" ON public.project_source_links AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_source_links_insert" ON public.project_source_links AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_source_links_delete" ON public.project_source_links AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- radar_brasis
DROP POLICY IF EXISTS "radar_brasis_select" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_insert" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_update" ON public.radar_brasis;
DROP POLICY IF EXISTS "radar_brasis_delete" ON public.radar_brasis;

CREATE POLICY "radar_brasis_select" ON public.radar_brasis AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_insert" ON public.radar_brasis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_brasis_update" ON public.radar_brasis AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_brasis_delete" ON public.radar_brasis AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- radar_keywords
DROP POLICY IF EXISTS "radar_keywords_select" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_insert" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_update" ON public.radar_keywords;
DROP POLICY IF EXISTS "radar_keywords_delete" ON public.radar_keywords;

CREATE POLICY "radar_keywords_select" ON public.radar_keywords AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_insert" ON public.radar_keywords AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_keywords_update" ON public.radar_keywords AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_keywords_delete" ON public.radar_keywords AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- radar_sources
DROP POLICY IF EXISTS "radar_sources_select" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_insert" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_update" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_delete" ON public.radar_sources;

CREATE POLICY "radar_sources_select" ON public.radar_sources AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_insert" ON public.radar_sources AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_sources_update" ON public.radar_sources AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_sources_delete" ON public.radar_sources AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- radar_tombstones
DROP POLICY IF EXISTS "radar_tombstones_select" ON public.radar_tombstones;
DROP POLICY IF EXISTS "radar_tombstones_insert" ON public.radar_tombstones;
DROP POLICY IF EXISTS "radar_tombstones_delete" ON public.radar_tombstones;

CREATE POLICY "radar_tombstones_select" ON public.radar_tombstones AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_insert" ON public.radar_tombstones AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "radar_tombstones_delete" ON public.radar_tombstones AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- shared_sources
DROP POLICY IF EXISTS "shared_sources_select" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_insert" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_update" ON public.shared_sources;
DROP POLICY IF EXISTS "shared_sources_delete" ON public.shared_sources;

CREATE POLICY "shared_sources_select" ON public.shared_sources AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "shared_sources_insert" ON public.shared_sources AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "shared_sources_update" ON public.shared_sources AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
CREATE POLICY "shared_sources_delete" ON public.shared_sources AS PERMISSIVE FOR DELETE TO authenticated USING (true);

-- source_group_assignments
DROP POLICY IF EXISTS "source_group_assignments_select" ON public.source_group_assignments;
DROP POLICY IF EXISTS "source_group_assignments_insert" ON public.source_group_assignments;
DROP POLICY IF EXISTS "source_group_assignments_delete" ON public.source_group_assignments;

CREATE POLICY "source_group_assignments_select" ON public.source_group_assignments AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_insert" ON public.source_group_assignments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "source_group_assignments_delete" ON public.source_group_assignments AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admin" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_insert_admin" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_update_admin" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_delete_admin" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_settings
DROP POLICY IF EXISTS "user_settings_select" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete" ON public.user_settings;

CREATE POLICY "user_settings_select" ON public.user_settings AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_insert" ON public.user_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_settings_update" ON public.user_settings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_settings_delete" ON public.user_settings AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
