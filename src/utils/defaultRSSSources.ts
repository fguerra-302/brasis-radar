
export const DEFAULT_RSS_SOURCES = [
  // Notícias Gerais (todas testadas e funcionando)
  { name: 'G1', url: 'https://g1.globo.com/rss/g1/', type: 'RSS' as const },
  { name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml', type: 'RSS' as const },
  { name: 'UOL Notícias', url: 'https://rss.uol.com.br/feed/noticias.xml', type: 'RSS' as const },
  { name: 'Agência Brasil', url: 'http://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', type: 'RSS' as const },
  
  // Economia e Negócios
  { name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/', type: 'RSS' as const },
  { name: 'Exame', url: 'https://exame.com/feed/', type: 'RSS' as const },
  
  // Tecnologia e Inovação
  { name: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/', type: 'RSS' as const },
  { name: 'Canaltech', url: 'https://canaltech.com.br/rss/', type: 'RSS' as const },
  
  // Cultura e Entretenimento
  { name: 'Papel Pop', url: 'https://papelpop.com/feed/', type: 'RSS' as const },
  { name: 'Rolling Stone Brasil', url: 'https://rollingstone.com.br/feed/', type: 'RSS' as const },
  
  // Sustentabilidade e Social
  { name: 'Conexão Planeta', url: 'https://conexaoplaneta.com.br/feed/', type: 'RSS' as const },
];
