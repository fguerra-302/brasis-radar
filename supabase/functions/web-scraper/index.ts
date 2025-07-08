import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Web scraper request received');

  try {
    const { url, sourceName, editoria = 'Geral' } = await req.json();
    
    // Input validation
    if (!url || !sourceName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'URL e nome da fonte são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Protocolo inválido');
      }
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: 'URL inválida. Use apenas URLs HTTP/HTTPS válidas.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize inputs
    const sanitizedUrl = url.trim().substring(0, 500);
    const sanitizedSourceName = sourceName.trim().substring(0, 100);
    const sanitizedEditoria = ['Cultura', 'Social', 'Negócios', 'Sustentabilidade', 'Regional', 'Geral'].includes(editoria) ? editoria : 'Geral';
    
    console.log(`🔍 Fazendo scraping de: ${sanitizedUrl}`);

    // Scraping simples com fetch nativo
    const response = await fetch(sanitizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const defaultUserId = '00000000-0000-0000-0000-000000000000';
    const processedItems = await processScrapedContent(html, sanitizedUrl, sanitizedSourceName, sanitizedEditoria, defaultUserId);

    // Salvar itens no banco
    const savedItems = [];
    for (const item of processedItems) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('radar_brasis')
          .select('id')
          .eq('link', item.link)
          .single();

        if (!existing) {
          const { data, error } = await supabase
            .from('radar_brasis')
            .insert(item)
            .select()
            .single();

          if (!error && data) {
            savedItems.push(data);
          }
        }
      } catch (error) {
        console.error('Erro ao salvar item:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      items_processed: processedItems.length,
      items_saved: savedItems.length,
      url: sanitizedUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no web scraping:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processScrapedContent(html: string, url: string, sourceName: string, editoria: string, userId: string) {
  const items = [];
  
  // Extrair título principal
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const mainTitle = titleMatch ? titleMatch[1].trim() : 'Conteúdo extraído';
  
  // Extrair parágrafos de conteúdo
  const paragraphMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
  
  // Combinar conteúdo
  const contentPieces = [...headingMatches, ...paragraphMatches]
    .map(piece => piece.replace(/<[^>]*>/g, '').trim())
    .filter(piece => piece.length > 50);
  
  const fullContent = contentPieces.join('\n\n');
  
  // Se não há conteúdo substancial, usar o título como base
  if (contentPieces.length === 0) {
    const analysis = analyzeContentRelevance(mainTitle, '');
    
    items.push({
      title: mainTitle.substring(0, 500),
      link: url.substring(0, 500),
      source: sourceName.substring(0, 100),
      pub_date: new Date().toISOString(),
      editoria: analysis.editoria || editoria,
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 10) : [],
      relevancia: Math.max(1, Math.min(5, analysis.relevancia || 1)),
      status: 'A curar',
      input_bruto: mainTitle.substring(0, 2000),
      resumo_curado: generateCuratedSummary(mainTitle, '', analysis),
      user_id: userId
    });
    
    return items;
  }
  
  // Dividir em seções se for muito longo
  const sections = splitIntoSections(fullContent, mainTitle);
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    if (section.content.length > 100) {
      const analysis = analyzeContentRelevance(section.title, section.content);
      
      if (analysis.relevancia >= 2) {
        const item = {
          title: section.title.substring(0, 500),
          link: (sections.length > 1 ? `${url}#section-${i + 1}` : url).substring(0, 500),
          source: sourceName.substring(0, 100),
          pub_date: new Date().toISOString(),
          editoria: analysis.editoria || editoria,
          tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 10) : [],
          relevancia: Math.max(1, Math.min(5, analysis.relevancia || 1)),
          status: 'A curar',
          input_bruto: section.content.substring(0, 2000),
          resumo_curado: generateCuratedSummary(section.title, section.content, analysis),
          user_id: userId
        };
        
        items.push(item);
      }
    }
  }
  
  return items;
}

function splitIntoSections(content: string, mainTitle: string) {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
  
  if (paragraphs.length <= 2) {
    return [{
      title: mainTitle,
      content: content
    }];
  }
  
  const sections = [];
  let currentSection = '';
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    
    if (paragraph.length < 100 && !paragraph.endsWith('.') && !paragraph.endsWith('!') && !paragraph.endsWith('?')) {
      if (currentSection) {
        sections.push({
          title: generateSectionTitle(currentSection),
          content: currentSection
        });
      }
      currentSection = paragraph + '\n\n';
    } else {
      currentSection += paragraph + '\n\n';
    }
  }
  
  if (currentSection) {
    sections.push({
      title: generateSectionTitle(currentSection),
      content: currentSection
    });
  }
  
  return sections;
}

function generateSectionTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  
  if (firstLine.length < 100) {
    return firstLine;
  }
  
  const words = firstLine.split(' ').slice(0, 8).join(' ');
  return words + '...';
}

function analyzeContentRelevance(title: string, content: string) {
  const fullText = `${title} ${content}`.toLowerCase();
  
  // Palavras-chave do DNA Brasis
  const culturalKeywords = ['música', 'arte', 'cultura', 'festival', 'artista', 'criatividade', 'identidade', 'design'];
  const regionalKeywords = ['nordeste', 'norte', 'sul', 'interior', 'periferia', 'comunidade', 'região', 'local'];
  const socialKeywords = ['educação', 'jovem', 'mulher', 'negro', 'indígena', 'lgbtq', 'diversidade', 'inclusão'];
  const businessKeywords = ['startup', 'empreendedor', 'inovação', 'marca', 'consumo', 'economia', 'mercado'];
  const sustainabilityKeywords = ['sustentabilidade', 'meio ambiente', 'clima', 'energia', 'reciclagem', 'verde'];
  
  let score = 1;
  let editoria = 'Geral';
  const tags = [];
  
  if (hasKeywords(fullText, culturalKeywords)) {
    score += 2;
    editoria = 'Cultura';
    tags.push('Cultura');
  }
  
  if (hasKeywords(fullText, regionalKeywords)) {
    score += 2;
    if (editoria === 'Geral') editoria = 'Regional';
    tags.push('Regional');
  }
  
  if (hasKeywords(fullText, socialKeywords)) {
    score += 1;
    if (editoria === 'Geral') editoria = 'Social';
    tags.push('Social');
  }
  
  if (hasKeywords(fullText, businessKeywords)) {
    score += 1;
    if (editoria === 'Geral') editoria = 'Negócios';
    tags.push('Negócios');
  }
  
  if (hasKeywords(fullText, sustainabilityKeywords)) {
    score += 1;
    if (editoria === 'Geral') editoria = 'Sustentabilidade';
    tags.push('Sustentabilidade');
  }
  
  if (fullText.includes('brasil') || fullText.includes('brasileiro')) {
    score += 1;
    tags.push('Brasil');
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

function generateCuratedSummary(title: string, content: string, analysis: any): string {
  const shortContent = content.substring(0, 200).replace(/\n/g, ' ').trim();
  
  const templates = [
    `${title} - ${shortContent}... Uma perspectiva que revela nuances do Brasil contemporâneo.`,
    `Conteúdo relevante: ${title}. ${shortContent}... Insights para marcas que querem entender o Brasil real.`,
    `${title}: ${shortContent}... Tendência emergente que merece atenção da indústria.`
  ];
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate.length > 500 ? randomTemplate.substring(0, 497) + '...' : randomTemplate;
}