import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage?: string;
}

interface ProcessedNews {
  title: string;
  link: string;
  source: string;
  pub_date: string;
  editoria: string;
  tags: string[];
  relevancia: number;
  status: string;
  resumo_curado: string;
}

async function buscarNoticiasNewsAPI(apiKey: string): Promise<NewsItem[]> {
  const urls = [
    // Notícias gerais do Brasil
    `https://newsapi.org/v2/everything?q=Brasil&language=pt&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`,
    // Startups e tecnologia
    `https://newsapi.org/v2/everything?q=startup%20OR%20tecnologia%20OR%20inovação&country=br&language=pt&sortBy=publishedAt&pageSize=15&apiKey=${apiKey}`,
    // Economia e negócios
    `https://newsapi.org/v2/everything?q=economia%20OR%20negócios%20OR%20empreendedorismo&country=br&language=pt&sortBy=publishedAt&pageSize=15&apiKey=${apiKey}`,
  ];

  const allNews: NewsItem[] = [];

  for (const url of urls) {
    try {
      console.log(`Buscando notícias de: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Erro na API: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.articles && Array.isArray(data.articles)) {
        allNews.push(...data.articles);
      }
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
    }
  }

  // Remove duplicatas baseado na URL
  const uniqueNews = allNews.filter((item, index, self) => 
    index === self.findIndex(t => t.url === item.url)
  );

  return uniqueNews.slice(0, 30); // Limita a 30 notícias
}

async function analisarComIA(noticia: NewsItem, openaiKey: string): Promise<ProcessedNews> {
  const prompt = `
Analise esta notícia brasileira e forneça:

TÍTULO: ${noticia.title}
DESCRIÇÃO: ${noticia.description || 'N/A'}
FONTE: ${noticia.source.name}

Responda APENAS com um JSON válido (sem markdown):
{
  "relevancia": [número de 1-5, onde 5 é muito relevante para o Brasil],
  "editoria": "[Tecnologia|Economia|Política|Cultura|Social|Saúde|Educação|Esportes]",
  "tags": ["tag1", "tag2", "tag3"],
  "resumo_curado": "[resumo em 1-2 frases destacando o impacto para o Brasil]",
  "status": "[A curar|Em aprovação]"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Você é um curador de conteúdo especializado em notícias do Brasil. Analise notícias e classifique sua relevância para o público brasileiro.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Determina status baseado na relevância
    const status = analysis.relevancia >= 4 ? 'Em aprovação' : 'A curar';

    return {
      title: noticia.title,
      link: noticia.url,
      source: noticia.source.name,
      pub_date: noticia.publishedAt,
      editoria: analysis.editoria,
      tags: analysis.tags,
      relevancia: analysis.relevancia,
      status: status,
      resumo_curado: analysis.resumo_curado,
    };
  } catch (error) {
    console.error('Erro na análise IA:', error);
    
    // Fallback manual
    return {
      title: noticia.title,
      link: noticia.url,
      source: noticia.source.name,
      pub_date: noticia.publishedAt,
      editoria: 'Geral',
      tags: ['brasil', 'notícia'],
      relevancia: 2,
      status: 'A curar',
      resumo_curado: noticia.description || noticia.title,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Pega as API keys dos secrets
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY não configurada nos secrets do Supabase');
    }

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada nos secrets do Supabase');
    }

    console.log('🚀 Iniciando curadoria automática...');

    // 1. Buscar notícias
    console.log('📰 Buscando notícias...');
    const noticias = await buscarNoticiasNewsAPI(newsApiKey);
    console.log(`✅ Encontradas ${noticias.length} notícias`);

    if (noticias.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nenhuma notícia encontrada',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificar quais notícias já existem
    const existingUrls = new Set();
    const { data: existing } = await supabaseClient
      .from('radar_brasis')
      .select('link');
    
    if (existing) {
      existing.forEach(item => existingUrls.add(item.link));
    }

    // Filtra apenas notícias novas
    const novasNoticias = noticias.filter(noticia => !existingUrls.has(noticia.url));
    console.log(`🆕 ${novasNoticias.length} notícias novas para processar`);

    const processedItems: ProcessedNews[] = [];

    // 3. Processar cada notícia com IA
    for (let i = 0; i < Math.min(novasNoticias.length, 10); i++) {
      const noticia = novasNoticias[i];
      console.log(`🤖 Analisando: ${noticia.title.substring(0, 50)}...`);
      
      const processed = await analisarComIA(noticia, openaiApiKey);
      processedItems.push(processed);
      
      // Delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Salvar no banco
    if (processedItems.length > 0) {
      console.log(`💾 Salvando ${processedItems.length} itens no banco...`);
      
      const { data, error } = await supabaseClient
        .from('radar_brasis')
        .insert(processedItems);

      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }

      console.log('✅ Curadoria concluída com sucesso!');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Curadoria concluída com sucesso!',
        processed: processedItems.length,
        total_found: noticias.length,
        new_items: novasNoticias.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na curadoria:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        processed: 0 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})