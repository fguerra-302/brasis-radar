
-- 1) Add UPDATE policy to project_source_links (owner-scoped)
CREATE POLICY "Users can update own project source links"
ON public.project_source_links
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) Restrict SECURITY DEFINER function execution where safe
-- has_role is required by RLS policies for authenticated users, keep it.
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, uuid, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_clawbot_new_content() FROM anon, authenticated, PUBLIC;

-- 3) Reduce GraphQL schema exposure to anon (RLS already blocks reads, but this hides schema)
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;

-- 4) Protect sensitive credential columns on radar_sources (legacy table pending removal)
REVOKE SELECT (credentials, external_api_config) ON public.radar_sources FROM anon, authenticated;

-- 5) Realtime channel authorization - restrict topic subscriptions to authenticated users
--    scoped by user id embedded in topic name (topic format: 'user:<uuid>:*' or table topics)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can access own realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated can access own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
  OR (realtime.topic() = 'radar:' || auth.uid()::text)
);

DROP POLICY IF EXISTS "Authenticated can send to own realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated can send to own realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
  OR (realtime.topic() = 'radar:' || auth.uid()::text)
);
