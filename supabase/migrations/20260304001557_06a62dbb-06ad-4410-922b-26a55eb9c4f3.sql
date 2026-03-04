-- 1. Create shared_sources table (global catalog)
CREATE TABLE public.shared_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'RSS',
  active BOOLEAN DEFAULT true,
  config JSONB DEFAULT NULL,
  credentials JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(url, type)
);

ALTER TABLE public.shared_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all shared sources"
  ON public.shared_sources FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shared sources"
  ON public.shared_sources FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update shared sources"
  ON public.shared_sources FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete shared sources"
  ON public.shared_sources FOR DELETE TO authenticated USING (true);

-- 2. Create project_folders table (user-specific folders)
CREATE TABLE public.project_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders"
  ON public.project_folders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON public.project_folders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.project_folders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.project_folders FOR DELETE USING (auth.uid() = user_id);

-- 3. Create project_source_links junction table
CREATE TABLE public.project_source_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.project_folders(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.shared_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(folder_id, source_id)
);

ALTER TABLE public.project_source_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own links"
  ON public.project_source_links FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links"
  ON public.project_source_links FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
  ON public.project_source_links FOR DELETE USING (auth.uid() = user_id);

-- 4. Migrate existing data from radar_sources to shared_sources (deduplicate by url+type)
INSERT INTO public.shared_sources (name, url, type, active, config, credentials)
SELECT DISTINCT ON (url, COALESCE(type, 'RSS'))
  name, url, COALESCE(type, 'RSS'), active, config, credentials
FROM public.radar_sources
ON CONFLICT (url, type) DO NOTHING;

-- 5. Updated_at triggers
CREATE TRIGGER update_shared_sources_updated_at
  BEFORE UPDATE ON public.shared_sources
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();

CREATE TRIGGER update_project_folders_updated_at
  BEFORE UPDATE ON public.project_folders
  FOR EACH ROW EXECUTE FUNCTION public.audit_updated_at();