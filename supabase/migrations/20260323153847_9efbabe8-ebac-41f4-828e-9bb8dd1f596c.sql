
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function that fires on INSERT to radar_brasis and calls the clawbot-webhook edge function
CREATE OR REPLACE FUNCTION public.notify_clawbot_new_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  service_key text;
  webhook_secret text;
  payload jsonb;
BEGIN
  -- Read config from vault/secrets
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  webhook_secret := current_setting('app.settings.cron_secret', true);

  -- Build payload
  payload := jsonb_build_object(
    'event', 'new_content',
    'timestamp', now()::text,
    'record', jsonb_build_object(
      'id', NEW.id,
      'title', NEW.title,
      'link', NEW.link,
      'source', NEW.source,
      'editoria', NEW.editoria,
      'relevancia', NEW.relevancia,
      'pub_date', NEW.pub_date,
      'tags', NEW.tags,
      'group_id', NEW.group_id,
      'status', NEW.status,
      'user_id', NEW.user_id
    )
  );

  -- Make async HTTP POST via pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/clawbot-webhook',
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    )::text
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block the INSERT if webhook fails
    RAISE WARNING 'Clawbot webhook notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on radar_brasis for new inserts
DROP TRIGGER IF EXISTS trigger_notify_clawbot ON public.radar_brasis;
CREATE TRIGGER trigger_notify_clawbot
  AFTER INSERT ON public.radar_brasis
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_clawbot_new_content();
