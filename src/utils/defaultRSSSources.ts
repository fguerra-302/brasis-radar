
export const DEFAULT_RSS_SOURCES = [
  // Notícias Gerais
  { name: 'G1', url: 'https://g1.globo.com/rss/g1/', type: 'RSS' as const },
  { name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml', type: 'RSS' as const },
  { name: 'UOL Notícias', url: 'https://rss.uol.com.br/feed/noticias.xml', type: 'RSS' as const },
  { name: 'Estadão', url: 'https://politica.estadao.com.br/rss.xml', type: 'RSS' as const },
  
  // Economia e Negócios
  { name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/', type: 'RSS' as const },
  { name: 'Valor Econômico', url: 'https://valor.globo.com/rss/home/', type: 'RSS' as const },
  { name: 'Exame', url: 'https://exame.com/feed/', type: 'RSS' as const },
  { name: 'CNN Brasil Economia', url: 'https://www.cnnbrasil.com.br/economia/feed/', type: 'RSS' as const },
  
  // Tecnologia e Inovação
  { name: 'TecMundo', url: 'https://feeds.feedburner.com/tecmundo', type: 'RSS' as const },
  { name: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/', type: 'RSS' as const },
  { name: 'StartupBase', url: 'https://startupbase.com.br/feed/', type: 'RSS' as const },
  { name: '1Bilhão', url: 'https://www.1bilhao.com.br/feed/', type: 'RSS' as const },
  
  // Cultura e Entretenimento
  { name: 'Omelete', url: 'https://www.omelete.com.br/feed', type: 'RSS' as const },
  { name: 'Papel Pop', url: 'https://papelpop.com/feed/', type: 'RSS' as const },
  { name: 'Rolling Stone Brasil', url: 'https://rollingstone.com.br/feed/', type: 'RSS' as const },
  { name: 'Hypeness', url: 'https://www.hypeness.com.br/feed/', type: 'RSS' as const },
  
  // Sustentabilidade e Social
  { name: 'Conexão Planeta', url: 'https://conexaoplaneta.com.br/feed/', type: 'RSS' as const },
  { name: 'Mobilize Brasil', url: 'https://www.mobilize.org.br/feed/', type: 'RSS' as const },
  
  // Regionais e Diversidade
  { name: 'Brasil de Fato', url: 'https://www.brasildefato.com.br/index.xml', type: 'RSS' as const },
  { name: 'Agência Brasil', url: 'http://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', type: 'RSS' as const }
];
