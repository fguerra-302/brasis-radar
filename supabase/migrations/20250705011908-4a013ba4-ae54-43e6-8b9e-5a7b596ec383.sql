-- Inserir alguns dados de exemplo para demonstração
INSERT INTO public.radar_brasis (
  title, 
  link, 
  source, 
  pub_date, 
  editoria, 
  tags, 
  relevancia, 
  status, 
  resumo_curado, 
  input_bruto
) VALUES 
(
  'Startup brasileira desenvolve AI para análise de sentimentos em redes sociais',
  'https://example.com/startup-ai-sentimentos',
  'TechCrunch Brasil',
  NOW() - INTERVAL '2 hours',
  'Tecnologia',
  ARRAY['startups', 'artificial intelligence', 'brasil', 'inovação'],
  5,
  'A curar',
  'Nova solução de IA criada por empreendedores brasileiros promete revolucionar análise de dados sociais para marcas.',
  'Uma startup brasileira acaba de lançar uma ferramenta revolucionária que usa inteligência artificial para analisar sentimentos em redes sociais...'
),
(
  'Festival de música regional movimenta economia do interior de Pernambuco',
  'https://example.com/festival-pernambuco',
  'Folha Nordeste',
  NOW() - INTERVAL '4 hours',
  'Cultura',
  ARRAY['cultura', 'regional', 'nordeste', 'economia', 'música'],
  4,
  'A curar',
  'Evento cultural no interior demonstra como manifestações regionais podem impulsionar desenvolvimento econômico local.',
  'O Festival de Forró e Cultura Popular de Caruaru atraiu mais de 50 mil pessoas no último fim de semana...'
),
(
  'Jovens empreendedores criam cooperativa sustentável na periferia de São Paulo',
  'https://example.com/cooperativa-sustentavel',
  'Brasil de Fato',
  NOW() - INTERVAL '6 hours',
  'Social',
  ARRAY['empreendedorismo', 'sustentabilidade', 'periferia', 'jovens', 'cooperativismo'],
  4,
  'Em aprovação',
  'Iniciativa inovadora combina sustentabilidade ambiental com geração de renda em comunidade periférica paulistana.',
  'Um grupo de jovens da zona leste de São Paulo desenvolveu uma cooperativa de reciclagem que já beneficia mais de 200 famílias...'
);

-- Inserir alguns dados para o editor de redes sociais
INSERT INTO public.radar_brasis (
  title, 
  link, 
  source, 
  pub_date, 
  editoria, 
  tags, 
  relevancia, 
  status, 
  resumo_curado, 
  input_bruto
) VALUES 
(
  'Designer brasileira ganha prêmio internacional por projeto de identidade visual sustentável',
  'https://example.com/designer-premio',
  'Design Brasil',
  NOW() - INTERVAL '1 hour',
  'Design',
  ARRAY['design', 'sustentabilidade', 'brasil', 'reconhecimento'],
  5,
  'Em edição',
  'Profissional brasileira é reconhecida globalmente por projeto que alia criatividade e consciência ambiental.',
  'A designer Maria Silva, de 28 anos, natural de Salvador, conquistou o prêmio Red Dot Design Award...'
);