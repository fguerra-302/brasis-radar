
CREATE TABLE public.brasis_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  observation text NOT NULL,
  reflection text,
  example text,
  tip text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.brasis_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brasis_content_select" ON public.brasis_content FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "brasis_content_insert" ON public.brasis_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "brasis_content_update" ON public.brasis_content FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "brasis_content_delete" ON public.brasis_content FOR DELETE TO authenticated USING (auth.uid() = user_id);
