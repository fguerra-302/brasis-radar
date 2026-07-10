
CREATE TABLE public.radar_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.radar_brasis(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_radar_audit_logs_item ON public.radar_audit_logs(item_id, created_at DESC);
CREATE INDEX idx_radar_audit_logs_user ON public.radar_audit_logs(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.radar_audit_logs TO authenticated;
GRANT ALL ON public.radar_audit_logs TO service_role;

ALTER TABLE public.radar_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own audit logs"
  ON public.radar_audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own audit logs"
  ON public.radar_audit_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all audit logs"
  ON public.radar_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
