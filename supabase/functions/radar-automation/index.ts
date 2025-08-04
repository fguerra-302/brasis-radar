
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

  console.log('🚀 Radar automation iniciado -', new Date().toISOString());

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar fontes ativas (sem filtro de usuário)
    console.log('📡 Buscando fontes ativas...');
    const { data: sources, error: sourcesError } = await supabaseClient
      .from('radar_sources')
      .select('*')
      .eq('active', true);

    if (sourcesError) {
      console.error('❌ Erro ao buscar fontes:', sourcesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar fontes configuradas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`📊 Encontradas ${sources?.length || 0} fontes ativas`);

    // Limpeza de dados antigos (mais de 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    try {
      const { error: cleanupError } = await supabaseClient
        .from('radar_brasis')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString());
        
      if (cleanupError) {
        console.log('⚠️ Erro na limpeza de dados antigos:', cleanupError);
      } else {
        console.log('🧹 Limpeza de dados antigos executada');
      }
    } catch (error) {
      console.log('⚠️ Falha na limpeza:', error);
    }

    let allItems: NewsItem[] = [];
    const processedSources = [];

    // Processar cada fonte RSS
    for (const source of sources || []) {
      console.log(`🔄 Processando fonte: ${source.name}`);
      try {
        if (source.type === 'RSS' && source.url) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          const response = await fetch(source.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; RadarBrasis/1.0)',
              'Accept': 'application/rss+xml, application/xml, text/xml'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.log(`⚠️ Erro HTTP ${response.status} para ${source.name}`);
            continue;
          }
          
          const xml = await response.text();
          console.log(`📄 XML recebido de ${source.name}, tamanho: ${xml.length} chars`);
          
          const items = parseRSSFeed(xml, source.name);
          console.log(`📰 ${items.length} itens extraídos de ${source.name}`);
          
          allItems = [...allItems, ...items];
          processedSources.push(source.name);
        }
      } catch (error) {
        console.log(`❌ Erro ao processar ${source.name}:`, error.message);
      }
    }

    console.log(`📊 Total de ${allItems.length} itens coletados de ${processedSources.length} fontes`);

    // Curadoria com IA
    const curatedItems = await curateWithAI(allItems);
    console.log(`🎯 ${curatedItems.length} itens aprovados pela curadoria`);

    // Salvar itens no banco (sem user_id)
    const savedItems = [];
    for (const item of curatedItems) {
      try {
        // Verificar se já existe (evitar duplicatas)
        const { data: existing } = await supabaseClient
          .from('radar_brasis')
          .select('id')
          .eq('link', item.link)
          .single();

        if (existing) {
          console.log(`⏭️  Item já existe: ${item.title.substring(0, 50)}...`);
          continue;
        }

        // Buscar um usuário padrão para associar os dados
        const { data: users } = await supabaseClient.auth.admin.listUsers()
        const defaultUserId = users?.users?.[0]?.id || null
        
        const { data, error } = await supabaseClient
          .from('radar_brasis')
          .insert({
            title: item.title.substring(0, 500),
            link: item.link.substring(0, 500),
            source: item.source.substring(0, 100),
            pub_date: item.pub_date,
            editoria: item.editoria || 'Geral',
            tags: Array.isArray(item.tags) ? item.tags.slice(0, 10) : [],
            relevancia: Math.max(1, Math.min(5, item.relevancia || 1)),
            status: item.status === 'A curar' ? 'Em aprovação' : item.status || 'Em aprovação',
            input_bruto: item.input_bruto ? item.input_bruto.substring(0, 2000) : null,
            resumo_curado: item.resumo_curado ? item.resumo_curado.substring(0, 1000) : null,
            user_id: defaultUserId
          })
          .select('id, title')
          .single();

        if (!error && data) {
          console.log(`✅ Salvo: ${data.title.substring(0, 50)}...`);
          savedItems.push(data);
        } else if (error) {
          console.log(`❌ Erro ao salvar item:`, error.message);
        }
      } catch (error) {
        console.log('❌ Erro ao processar item:', error.message);
      }
    }

    const result = { 
      success: true, 
      processedSources: processedSources.length,
      totalItems: allItems.length,
      curatedItems: curatedItems.length,
      savedItems: savedItems.length,
      sources: processedSources
    };

    console.log('🎉 Automação concluída:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Erro fatal na automação:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function parseRSSFeed(xml: string, sourceName: string): NewsItem[] {
  console.log(`🔍 Parseando RSS de ${sourceName}...`);
  const items: NewsItem[] = [];
  
  // Regex melhorados para RSS
  const itemPattern = /<item>(.*?)<\/item>/gs;
  const titlePattern = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s;
  const linkPattern = /<link>(.*?)<\/link>/s;
  const datePattern = /<pubDate>(.*?)<\/pubDate>|<dc:date>(.*?)<\/dc:date>|<published>(.*?)<\/published>/s;
  const descPattern = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s;
  const contentPattern = /<content:encoded>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/content:encoded>/s;

  let match;
  let itemCount = 0;
  
  while ((match = itemPattern.exec(xml)) !== null && itemCount < 15) { // Limite de 15 itens por fonte
    const itemXml = match[1];
    
    const titleMatch = titlePattern.exec(itemXml);
    const linkMatch = linkPattern.exec(itemXml);
    const dateMatch = datePattern.exec(itemXml);
    const descMatch = descPattern.exec(itemXml);
    const contentMatch = contentPattern.exec(itemXml);
    
    if (titleMatch && linkMatch) {
      const rawDescription = contentMatch ? contentMatch[1] : (descMatch ? descMatch[1] : '');
      const cleanDescription = cleanHtmlText(rawDescription);
      
      // Filtrar itens muito antigos (mais de 3 dias)
      const pubDate = dateMatch ? new Date(dateMatch[1] || dateMatch[2] || dateMatch[3]) : new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      if (pubDate < threeDaysAgo) {
        continue; // Pular itens antigos
      }
      
      const title = cleanHtmlText(titleMatch[1] || '').trim();
      const link = linkMatch[1].trim();
      
      if (title && link && title.length > 10) { // Validação básica
        items.push({
          title,
          link,
          source: sourceName,
          pub_date: pubDate.toISOString(),
          description: cleanDescription.trim()
        });
        itemCount++;
      }
    }
  }
  
  console.log(`📰 ${items.length} itens válidos extraídos de ${sourceName}`);
  return items;
}

function cleanHtmlText(htmlText: string): string {
  if (!htmlText) return '';
  
  // Remove tags HTML
  let cleanText = htmlText.replace(/<[^>]*>/g, '');
  
  // Decodifica entidades HTML
  const htmlEntities: { [key: string]: string } = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'",
    '&apos;': "'", '&nbsp;': ' ', '&hellip;': '...', '&mdash;': '—',
    '&ndash;': '–', '&ldquo;': '"', '&rdquo;': '"', '&lsquo;': "'",
    '&rsquo;': "'", '&reg;': '®', '&copy;': '©', '&trade;': '™'
  };
  
  for (const [entity, replacement] of Object.entries(htmlEntities)) {
    cleanText = cleanText.replace(new RegExp(entity, 'gi'), replacement);
  }
  
  // Remove entidades numéricas
  cleanText = cleanText.replace(/&#x?[0-9a-fA-F]+;/g, '');
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  return cleanText.length > 300 ? cleanText.substring(0, 297) + '...' : cleanText;
}

async function curateWithAI(items: NewsItem[]) {
  console.log(`🤖 Iniciando curadoria IA para ${items.length} itens...`);
  const curatedItems = [];
  
  for (const item of items) {
    const analysis = analyzeRelevanceForBrasis(item);
    
    // Aceitar itens com relevância 2+ (mais permissivo para ter mais conteúdo)
    if (analysis.relevancia >= 2) {
      const curatedItem = {
        ...item,
        editoria: analysis.editoria,
        tags: analysis.tags,
        relevancia: analysis.relevancia,
        status: analysis.relevancia >= 4 ? 'Para Newsletter' : 'A curar',
        input_bruto: item.description || '',
        resumo_curado: generateCuratedSummary(item, analysis)
      };
      
      curatedItems.push(curatedItem);
    }
  }
  
  // Ordenar por relevância e data (mais recentes primeiro)
  return curatedItems
    .sort((a, b) => {
      const scoreA = b.relevancia - a.relevancia;
      if (scoreA !== 0) return scoreA;
      return new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime();
    })
    .slice(0, 30); // Top 30 itens
}

function analyzeRelevanceForBrasis(item: NewsItem) {
  const title = item.title.toLowerCase();
  const description = (item.description || '').toLowerCase();
  const fullText = `${title} ${description}`;
  
  // Palavras-chave atualizadas para capturar mais conteúdo relevante
  const culturalKeywords = ['música', 'arte', 'cultura', 'festival', 'artista', 'cinema', 'teatro', 'literatura', 'dança'];
  const businessKeywords = ['startup', 'empreendedor', 'inovação', 'tecnologia', 'economia', 'mercado', 'negócios'];
  const socialKeywords = ['educação', 'saúde', 'sociedade', 'política', 'jovem', 'diversidade', 'inclusão'];
  const regionalKeywords = ['brasil', 'brasileiro', 'nacional', 'país', 'região', 'estado', 'cidade'];
  const trendKeywords = ['tendência', 'novo', 'lançamento', 'crescimento', 'futuro', 'digital', 'sustentável'];
  
  let score = 1;
  let editoria = 'Geral';
  const tags = [];
  
  // Análise por categoria (pontuação mais generosa)
  if (hasKeywords(fullText, culturalKeywords)) {
    score += 2;
    editoria = 'Cultura';
    tags.push('Cultura');
  }
  
  if (hasKeywords(fullText, businessKeywords)) {
    score += 2;
    if (editoria === 'Geral') editoria = 'Negócios';
    tags.push('Inovação');
  }
  
  if (hasKeywords(fullText, socialKeywords)) {
    score += 1;
    if (editoria === 'Geral') editoria = 'Social';
    tags.push('Sociedade');
  }
  
  if (hasKeywords(fullText, regionalKeywords)) {
    score += 1;
    tags.push('Brasil');
  }
  
  if (hasKeywords(fullText, trendKeywords)) {
    score += 1;
    tags.push('Tendência');
  }
  
  // Bonus para conteúdo recente (últimas 24h)
  const now = new Date();
  const itemDate = new Date(item.pub_date);
  const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff <= 24) {
    score += 1;
    tags.push('Recente');
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

function generateCuratedSummary(item: NewsItem, analysis: any): string {
  const templates = [
    `📈 ${item.title.split(' ').slice(0, 10).join(' ')}... - Uma tendência que merece atenção no radar brasileiro.`,
    `🎯 Destaque: ${item.title.split(' ').slice(0, 8).join(' ')}... mostra movimento interessante no setor.`,
    `💡 Inovação em foco: ${item.title.split(' ').slice(0, 9).join(' ')}... pode impactar o cenário nacional.`,
    `🚀 Em alta: ${item.title.split(' ').slice(0, 7).join(' ')}... representa nova oportunidade de mercado.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}
