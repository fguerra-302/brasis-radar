-- Configurar cron job para coleta automatizada a cada 30 minutos
SELECT cron.schedule(
  'radar-automation-job',
  '*/30 * * * *', -- A cada 30 minutos
  $$
  SELECT
    net.http_post(
        url:='https://vlsirftmzvmilugalbpr.supabase.co/functions/v1/radar-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsc2lyZnRtenZtaWx1Z2FsYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTI5NjIsImV4cCI6MjA2Njk2ODk2Mn0.fUIxk9Dlml9AzIdgc0b4pVnrx99gCN_iznLbnqHbC8A"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Configurar cron job adicional para limpeza semanal (remove itens ignorados antigos)
SELECT cron.schedule(
  'radar-cleanup-job',
  '0 2 * * 0', -- Todo domingo às 2h
  $$
  DELETE FROM public.radar_brasis 
  WHERE status = 'Ignorado' 
  AND created_at < NOW() - INTERVAL '30 days';
  $$
);