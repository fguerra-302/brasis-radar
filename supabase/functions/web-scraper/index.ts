import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validação de URL segura
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Apenas HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Bloquear IPs locais/privados
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Sanitizar texto
function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

// Extrair conteúdo de HTML
async function extractContent(html: string, sourceUrl: string): Promise<{
  title: string;
  items: Array<{ title: string; content: string; link: string }>;
}> {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? sanitizeText(titleMatch[1]) : 'Sem título';

  const items: Array<{ title: string; content: string; link: string }> = [];

  // Extrair artigos/seções
  const articleRegex = /<article[^>]*>(.*?)<\/article>/gis;
  const articles = html.match(articleRegex) || [];

  for (const article of articles.slice(0, 10)) {
    const h2Match = article.match(/<h2[^>]*>([^<]+)<\/h2>/i);
    const h3Match = article.match(/<h3[^>]*>([^<]+)<\/h3>/i);
    const titleText = h2Match?.[1] || h3Match?.[1] || '';

    const pMatches = article.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
    const paragraphs = Array.from(pMatches).map(m => m[1]).join(' ');

    const linkMatch = article.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
    let itemLink = linkMatch?.[1] || sourceUrl;
    
    // Converter URLs relativas em absolutas
    if (itemLink.startsWith('/')) {
      const baseUrl = new URL(sourceUrl);
      itemLink = `${baseUrl.protocol}//${baseUrl.host}${itemLink}`;
    }

    if (titleText && paragraphs) {
      items.push({
        title: sanitizeText(titleText),
        content: sanitizeText(paragraphs),
        link: itemLink,
      });
    }
  }

  // Se não encontrou artigos, tentar extrair parágrafos gerais
  if (items.length === 0) {
    const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
    const headers = Array.from(html.matchAll(h2Regex));
    
    for (const header of headers.slice(0, 5)) {
      const title = sanitizeText(header[1]);
      const afterHeader = html.substring(header.index! + header[0].length);
      const nextH2 = afterHeader.search(/<h2[^>]*>/i);
      const section = nextH2 > 0 ? afterHeader.substring(0, nextH2) : afterHeader.substring(0, 1000);
      
      const pMatches = section.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
      const content = Array.from(pMatches).map(m => m[1]).join(' ');
      
      if (title && content) {
        items.push({
          title,
          content: sanitizeText(content),
          link: sourceUrl,
        });
      }
    }
  }

  return { title: pageTitle, items };
}

// Analisar relevância com IA
async function analyzeRelevance(
  title: string,
  content: string,
  editoria: string
): Promise<{ relevancia: number; tags: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY não configurada, usando relevância padrão');
    return { relevancia: 3, tags: [editoria] };
  }

  try {
    const prompt = `Analise a relevância deste conteúdo para a editoria "${editoria}".

Título: ${title}
Conteúdo: ${content.substring(0, 500)}

Retorne APENAS um JSON válido com:
{
  "relevancia": [número de 1-5, onde 5 é muito relevante],
  "tags": [array com 2-4 tags descritivas em português]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um assistente que analisa relevância de conteúdo e retorna apenas JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Erro na API Lovable AI:', response.status);
      return { relevancia: 3, tags: [editoria] };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    
    // Extrair JSON da resposta (pode vir com markdown)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        relevancia: Math.min(5, Math.max(1, parsed.relevancia || 3)),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4) : [editoria],
      };
    }

    return { relevancia: 3, tags: [editoria] };
  } catch (error) {
    console.error('Erro ao analisar relevância:', error);
    return { relevancia: 3, tags: [editoria] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Autenticação necessária');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { url, sourceName, editoria } = await req.json();

    if (!url || !sourceName || !editoria) {
      throw new Error('Parâmetros obrigatórios: url, sourceName, editoria');
    }

    if (!isValidUrl(url)) {
      throw new Error('URL inválida ou insegura');
    }

    // Verificar se a fonte está ativa no banco
    const { data: sourceCheck } = await supabase
      .from('radar_sources')
      .select('active')
      .eq('url', url)
      .eq('user_id', user.id)
      .maybeSingle();

    if (sourceCheck && !sourceCheck.active) {
      console.log(`⏭️ Fonte desativada: ${sourceName}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Esta fonte está desativada. Ative-a em Configurações > Fontes para coletar conteúdo.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Iniciando scraping: ${url}`);

    // Carregar user_settings e tombstones
    const [settingsResult, tombstonesResult] = await Promise.all([
      supabase
        .from('user_settings')
        .select('min_relevance_threshold')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('radar_tombstones')
        .select('link')
        .eq('user_id', user.id)
    ]);

    const minRelevance = settingsResult.data?.min_relevance_threshold || 3;
    const tombstoneLinks = new Set(
      tombstonesResult.data?.map((t) => t.link) || []
    );

    console.log(`Threshold do usuário: ${minRelevance}`);

    // Fetch com timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadarBrasis/1.0)',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Erro ao acessar URL: ${response.status}`);
    }

    const html = await response.text();
    const { title: pageTitle, items } = await extractContent(html, url);

    console.log(`Extraídos ${items.length} itens de ${pageTitle}`);

    let itemsSaved = 0;
    const results = [];

    for (const item of items) {
      // Pular se foi excluído permanentemente
      if (tombstoneLinks.has(item.link)) {
        results.push({ title: item.title, saved: false, reason: 'Excluído anteriormente' });
        continue;
      }

      // Analisar relevância com IA
      const { relevancia, tags } = await analyzeRelevance(item.title, item.content, editoria);

      // Aplicar threshold do usuário
      if (relevancia >= minRelevance) {
        const { data, error } = await supabase
          .from('radar_brasis')
          .insert({
            user_id: user.id,
            title: item.title,
            link: item.link,
            source: sourceName,
            pub_date: new Date().toISOString(),
            editoria,
            tags,
            relevancia,
            status: 'Coletado',
            input_bruto: item.content,
          })
          .select()
          .single();

        if (!error) {
          itemsSaved++;
          results.push({ title: item.title, relevancia, saved: true });
        } else {
          console.error('Erro ao salvar item:', error);
          results.push({ title: item.title, relevancia, saved: false, error: error.message });
        }
      } else {
        results.push({ title: item.title, relevancia, saved: false, reason: 'Baixa relevância' });
      }
    }

    console.log(`Salvos ${itemsSaved} de ${items.length} itens`);

    return new Response(
      JSON.stringify({
        success: true,
        items_processed: items.length,
        items_saved: itemsSaved,
        page_title: pageTitle,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro em web-scraper:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
