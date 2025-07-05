-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Habilitar replica identity para real-time updates
ALTER TABLE public.radar_brasis REPLICA IDENTITY FULL;

-- Adicionar tabela ao publication para real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.radar_brasis;