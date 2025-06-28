
-- Create radar_brasis table
CREATE TABLE IF NOT EXISTS radar_brasis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  pub_date TEXT NOT NULL,
  editoria TEXT NOT NULL DEFAULT 'Geral',
  tags TEXT[] DEFAULT '{}',
  relevancia INTEGER DEFAULT 1 CHECK (relevancia >= 1 AND relevancia <= 5),
  status TEXT DEFAULT 'A curar' CHECK (status IN ('A curar', 'Em aprovação', 'Publicado', 'Ignorado')),
  input_bruto TEXT,
  resumo_curado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create radar_sources table
CREATE TABLE IF NOT EXISTS radar_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create radar_keywords table
CREATE TABLE IF NOT EXISTS radar_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Insert default sources
INSERT INTO radar_sources (name, url, active) VALUES
  ('G1 Nordeste', 'https://g1.globo.com/rss/g1/nordeste/', true),
  ('UOL Universa', 'https://rss.uol.com.br/feed/universa.xml', true),
  ('Folha Cotidiano', 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml', true),
  ('O Globo Cultura', 'https://oglobo.globo.com/rss/cultura/', true),
  ('Nexo', 'https://www.nexojornal.com.br/rss/ultimo', true)
ON CONFLICT DO NOTHING;

-- Insert default keyword categories
INSERT INTO radar_keywords (category_name, keywords, weight) VALUES
  ('Cultura & Identidade', ARRAY['música', 'arte', 'cultura', 'festival', 'artista', 'criatividade', 'identidade'], 3),
  ('Brasil Real', ARRAY['nordeste', 'norte', 'sul', 'interior', 'periferia', 'comunidade', 'região'], 3),
  ('Diversidade', ARRAY['educação', 'jovem', 'mulher', 'negro', 'indígena', 'LGBTQ', 'diversidade'], 2),
  ('Inovação', ARRAY['startup', 'empreendedor', 'inovação', 'marca', 'consumo', 'economia'], 2),
  ('Sustentabilidade', ARRAY['sustentabilidade', 'meio ambiente', 'clima', 'energia', 'reciclagem'], 1)
ON CONFLICT DO NOTHING;

-- Insert sample data
INSERT INTO radar_brasis (title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado) VALUES
  ('Nova tendência cultural emerge no Nordeste brasileiro', 'https://example.com/1', 'G1 Nordeste', '2024-01-15', 'Cultura', ARRAY['nordeste', 'cultura', 'tendência'], 4, 'A curar', 'Movimento cultural no Nordeste revela nova potência criativa que pode interessar marcas buscando autenticidade regional.'),
  ('Startup de educação cresce 300% em escolas públicas', 'https://example.com/2', 'UOL', '2024-01-14', 'Negócios', ARRAY['educação', 'startup', 'escolas públicas'], 5, 'Em aprovação', 'Inovação educacional mostra como tecnologia pode transformar ensino público brasileiro.')
ON CONFLICT (link) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE radar_brasis ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your auth requirements)
CREATE POLICY "Allow all operations on radar_brasis" ON radar_brasis FOR ALL USING (true);
CREATE POLICY "Allow all operations on radar_sources" ON radar_sources FOR ALL USING (true);
CREATE POLICY "Allow all operations on radar_keywords" ON radar_keywords FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_radar_brasis_created_at ON radar_brasis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_status ON radar_brasis(status);
CREATE INDEX IF NOT EXISTS idx_radar_brasis_relevancia ON radar_brasis(relevancia DESC);
CREATE INDEX IF NOT EXISTS idx_radar_sources_active ON radar_sources(active);
