
-- Drop all RESTRICTIVE policies on shared_sources
DROP POLICY IF EXISTS "Authenticated users can view all shared sources" ON public.shared_sources;
DROP POLICY IF EXISTS "Authenticated users can insert shared sources" ON public.shared_sources;
DROP POLICY IF EXISTS "Authenticated users can update shared sources" ON public.shared_sources;
DROP POLICY IF EXISTS "Authenticated users can delete shared sources" ON public.shared_sources;

-- Drop all RESTRICTIVE policies on project_folders
DROP POLICY IF EXISTS "Users can view their own folders" ON public.project_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.project_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.project_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.project_folders;

-- Drop all RESTRICTIVE policies on project_source_links
DROP POLICY IF EXISTS "Users can view their own links" ON public.project_source_links;
DROP POLICY IF EXISTS "Users can insert their own links" ON public.project_source_links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.project_source_links;

-- Recreate as PERMISSIVE policies: shared_sources (open to all authenticated)
CREATE POLICY "Authenticated users can view all shared sources" ON public.shared_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert shared sources" ON public.shared_sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update shared sources" ON public.shared_sources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete shared sources" ON public.shared_sources FOR DELETE TO authenticated USING (true);

-- Recreate as PERMISSIVE policies: project_folders (user-scoped)
CREATE POLICY "Users can view their own folders" ON public.project_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own folders" ON public.project_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.project_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.project_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recreate as PERMISSIVE policies: project_source_links (user-scoped)
CREATE POLICY "Users can view their own links" ON public.project_source_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own links" ON public.project_source_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own links" ON public.project_source_links FOR DELETE TO authenticated USING (auth.uid() = user_id);
