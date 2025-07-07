
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pub_date: string;
  content?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar fontes configuradas pelo usuário autenticado
    const { data: userSources, error: sourcesError } = await supabaseClient
      .from('radar_sources')
      .select('*')
      .eq('active', true)
      .eq('user_id', user.id);

    if (sourcesError) {
      console.error('Erro ao buscar fontes:', sourcesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar fontes configuradas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const sources = userSources || [];

    let allItems: NewsItem[] = [];

    // Limpeza semanal de dados antigos
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    try {
      await supabaseClient
        .from('radar_brasis')
        .delete()
        .lt('created_at', oneWeekAgo.toISOString());
    } catch (error) {
      console.log('Erro na limpeza de dados antigos:', error);
    }

    // Captura de todas as fontes configuradas
    for (const source of sources) {
      try {
        if (source.type === 'RSS') {
          const response = await fetch(source.url);
          const xml = await response.text();
          
          // Parse básico do RSS
          const items = parseRSSFeed(xml, source.name);
          allItems = [...allItems, ...items];
        }
      } catch (error) {
        console.log(`Erro ao capturar ${source.name}:`, error);
      }
    }

    // IA para curadoria e análise de relevância
    const curatedItems = await curateWithAI(allItems);

    // Salva apenas os itens mais relevantes para o usuário autenticado
    const savedItems = [];
    for (const item of curatedItems) {
      try {
        // Validar dados de entrada
        if (!item.title || !item.link || !item.source) {
          console.log('Item inválido ignorado:', item);
          continue;
        }

        const { data, error } = await supabaseClient
          .from('radar_brasis')
          .upsert({
            title: item.title.substring(0, 500), // Limitar tamanho
            link: item.link.substring(0, 500),
            source: item.source.substring(0, 100),
            pub_date: item.pub_date,
            editoria: item.editoria || 'Geral',
            tags: Array.isArray(item.tags) ? item.tags.slice(0, 10) : [],
            relevancia: Math.max(1, Math.min(5, item.relevancia || 1)),
            status: item.status || 'A curar',
            input_bruto: item.input_bruto ? item.input_bruto.substring(0, 2000) : null,
            resumo_curado: item.resumo_curado ? item.resumo_curado.substring(0, 1000) : null,
            user_id: user.id
          }, { 
            onConflict: 'link',
            ignoreDuplicates: true 
          });

        if (!error && data) {
          savedItems.push(data);
        }
      } catch (error) {
        console.log('Erro ao salvar item:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedSources: sources.length,
        totalItems: allItems.length,
        curatedItems: curatedItems.length,
        savedItems: savedItems.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function parseRSSFeed(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // Regex para extrair itens do RSS
  const itemPattern = /<item>(.*?)<\/item>/gs;
  const titlePattern = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s;
  const linkPattern = /<link>(.*?)<\/link>/s;
  const datePattern = /<pubDate>(.*?)<\/pubDate>/s;
  const descPattern = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s;

  let match;
  while ((match = itemPattern.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = titlePattern.exec(itemXml);
    const linkMatch = linkPattern.exec(itemXml);
    const dateMatch = datePattern.exec(itemXml);
    const descMatch = descPattern.exec(itemXml);
    
    if (titleMatch && linkMatch) {
      const rawDescription = descMatch ? (descMatch[1] || descMatch[2] || '') : '';
      const cleanDescription = cleanHtmlText(rawDescription);
      
      items.push({
        title: cleanHtmlText(titleMatch[1] || titleMatch[2] || '').trim(),
        link: linkMatch[1].trim(),
        source: sourceName,
        pub_date: dateMatch ? dateMatch[1] : new Date().toISOString(),
        description: cleanDescription.trim()
      });
    }
  }
  
  return items.slice(0, 10); // Limita a 10 itens por fonte
}

function cleanHtmlText(htmlText: string): string {
  if (!htmlText) return '';
  
  // Remove tags HTML
  let cleanText = htmlText.replace(/<[^>]*>/g, '');
  
  // Decodifica entidades HTML comuns
  const htmlEntities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&reg;': '®',
    '&copy;': '©',
    '&trade;': '™'
  };
  
  // Substitui entidades HTML
  for (const [entity, replacement] of Object.entries(htmlEntities)) {
    cleanText = cleanText.replace(new RegExp(entity, 'gi'), replacement);
  }
  
  // Remove entidades numéricas (&#123; ou &#xAB;)
  cleanText = cleanText.replace(/&#x?[0-9a-fA-F]+;/g, '');
  
  // Remove espaços em excesso e quebras de linha
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  // Limita o tamanho do texto para evitar descrições muito longas
  if (cleanText.length > 300) {
    cleanText = cleanText.substring(0, 297) + '...';
  }
  
  return cleanText;
}

async function curateWithAI(items: NewsItem[]) {
  const curatedItems = [];
  
  for (const item of items) {
    // Análise de relevância baseada no DNA da Brasis
    const analysis = analyzeRelevanceForBrasis(item);
    
    if (analysis.relevancia >= 3) { // Só aceita itens com relevância 3+
      const curatedItem = {
        ...item,
        editoria: analysis.editoria,
        tags: analysis.tags,
        relevancia: analysis.relevancia,
        status: analysis.relevancia >= 4 ? 'Em aprovação' : 'A curar',
        input_bruto: item.description || '',
        resumo_curado: await generateCuratedSummary(item, analysis)
      };
      
      curatedItems.push(curatedItem);
    }
  }
  
  // Ordena por relevância e pega os top 20
  return curatedItems
    .sort((a, b) => b.relevancia - a.relevancia)
    .slice(0, 20);
}

function analyzeRelevanceForBrasis(item: NewsItem) {
  const title = item.title.toLowerCase();
  const description = (item.description || '').toLowerCase();
  const fullText = `${title} ${description}`;
  
  // Palavras-chave do DNA Brasis (Brasil real, diversidade, cultura)
  const culturalKeywords = ['música', 'arte', 'cultura', 'festival', 'artista', 'criatividade', 'identidade'];
  const regionalKeywords = ['nordeste', 'norte', 'sul', 'interior', 'periferia', 'comunidade', 'região'];
  const socialKeywords = ['educação', 'jovem', 'mulher', 'negro', 'indígena', 'LGBTQ', 'diversidade'];
  const businessKeywords = ['startup', 'empreendedor', 'inovação', 'marca', 'consumo', 'economia'];
  const sustainabilityKeywords = ['sustentabilidade', 'meio ambiente', 'clima', 'energia', 'reciclagem'];
  
  let score = 1;
  let editoria = 'Geral';
  const tags = [];
  
  // Análise por categoria
  if (hasKeywords(fullText, culturalKeywords)) {
    score += 2;
    editoria = 'Cultura';
    tags.push('Cultura');
  }
  
  if (hasKeywords(fullText, regionalKeywords)) {
    score += 2;
    tags.push('Regional');
  }
  
  if (hasKeywords(fullText, socialKeywords)) {
    score += 1;
    if (editoria === 'Geral') editoria = 'Social';
    tags.push('Diversidade');
  }
  
  if (hasKeywords(fullText, businessKeywords)) {
    score += 1;
    if (editoria === 'Geral') editoria = 'Negócios';
    tags.push('Inovação');
  }
  
  if (hasKeywords(fullText, sustainabilityKeywords)) {
    score += 1;
    if (editoria === 'Geral') editoria = 'Sustentabilidade';
    tags.push('Sustentabilidade');
  }
  
  // Boost para conteúdo fora do mainstream
  if (fullText.includes('periferia') || fullText.includes('interior') || fullText.includes('comunidade')) {
    score += 1;
    tags.push('Brasil Real');
  }
  
  return {
    relevancia: Math.min(score, 5),
    editoria,
    tags: [...new Set(tags)]
  };
}

function hasKeywords(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

async function generateCuratedSummary(item: NewsItem, analysis: any): Promise<string> {
  // Simulação de resumo curado com tom Brasis
  const templates = [
    `${item.title.split(' ').slice(0, 8).join(' ')}... revela como o Brasil real está se movimentando fora do radar mainstream.`,
    `Tendência emergente: ${item.title.toLowerCase()} mostra uma nova camada cultural que marcas ainda não perceberam.`,
    `O que esta notícia diz sobre o futuro do consumo brasileiro: ${item.title.split(' ').slice(0, 6).join(' ')}...`,
  ];
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate;
}
