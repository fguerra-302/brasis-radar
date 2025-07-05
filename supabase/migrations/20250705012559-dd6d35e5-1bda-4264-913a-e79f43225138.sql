-- Visualizar jobs cron configurados (para verificação)
SELECT jobname, schedule, active, command 
FROM cron.job 
WHERE jobname IN ('radar-automation-job', 'radar-cleanup-job');

-- Adicionar constraint unique na coluna name
ALTER TABLE public.radar_sources 
ADD CONSTRAINT radar_sources_name_unique UNIQUE (name);

-- Inserir fontes RSS de exemplo
INSERT INTO public.radar_sources (name, url, type, active) 
VALUES 
  ('G1 Tecnologia', 'https://g1.globo.com/rss/g1/tecnologia/', 'RSS', true),
  ('Folha Empreendedorismo', 'https://feeds.folha.uol.com.br/empreendedor/rss091.xml', 'RSS', true),
  ('TechCrunch Brasil', 'https://techcrunch.com/category/startups/feed/', 'RSS', true)
ON CONFLICT (name) DO NOTHING;