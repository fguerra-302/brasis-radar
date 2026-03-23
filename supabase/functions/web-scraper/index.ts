import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const ALLOWED_ORIGINS = [
  'https://3d99c837-5852-4c57-9505-d2ca60666732.lovableproject.com',
  'https://vlsirftmzvmilugalbpr.supabase.co'
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Security: generic error messages for client, detailed logs server-side
function createErrorResponse(
  corsHeaders: Record<string, string>,
  userMessage: string,
  status: number,
  internalContext?: string,
  internalError?: unknown
) {
  if (internalContext) {
    console.error(`[web-scraper] ${internalContext}:`, internalError || userMessage);
  }
  return new Response(
    JSON.stringify({ success: false, error: userMessage }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Enhanced URL validation with security limits
function isValidUrl(url: string): { valid: boolean; reason?: string } {
  // URL length limit (RFC 2616 recommends max 2048)
  if (url.length > 2048) {
    return { valid: false, reason: 'URL too long' };
  }

  try {
    const parsed = new URL(url);
    
    // Only HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, reason: 'Invalid protocol' };
    }
    
    // Hostname length limit (RFC 1035)
    if (parsed.hostname.length > 253) {
      return { valid: false, reason: 'Hostname too long' };
    }
    
    // Block local/private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { valid: false, reason: 'Local/private addresses not allowed' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

// Sanitize text - remove scripts and limit size
function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

// Extract content from HTML
async function extractContent(html: string, sourceUrl: string): Promise<{
  title: string;
  items: Array<{ title: string; content: string; link: string }>;
}> {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? sanitizeText(titleMatch[1]) : 'Sem título';

  const items: Array<{ title: string; content: string; link: string }> = [];

  // Extract articles/sections
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
    
    // Convert relative URLs to absolute
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

  // If no articles found, try extracting general paragraphs
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

// Analyze relevance with AI
async function analyzeRelevance(
  title: string,
  content: string,
  editoria: string
): Promise<{ relevancia: number; tags: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[web-scraper] LOVABLE_API_KEY not configured, using default relevance');
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
      console.error('[web-scraper] AI API error:', response.status);
      return { relevancia: 3, tags: [editoria] };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    
    // Extract JSON from response (may come with markdown)
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
    console.error('[web-scraper] Error analyzing relevance:', error);
    return { relevancia: 3, tags: [editoria] };
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createErrorResponse(corsHeaders, 'Autenticação necessária', 401, 'Missing auth header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createErrorResponse(corsHeaders, 'Usuário não autenticado', 401, 'Auth failed', authError);
    }

    const { url, sourceName, editoria } = await req.json();

    if (!url || !sourceName || !editoria) {
      return createErrorResponse(corsHeaders, 'Parâmetros obrigatórios ausentes', 400);
    }

    // Enhanced URL validation
    const urlValidation = isValidUrl(url);
    if (!urlValidation.valid) {
      return createErrorResponse(corsHeaders, 'URL inválida', 400, 'URL validation failed', urlValidation.reason);
    }

    // Check if source exists and is active in the shared catalog
    const { data: sourceCheck } = await supabase
      .from('shared_sources')
      .select('id, active')
      .eq('url', url)
      .maybeSingle();

    if (!sourceCheck || !sourceCheck.active) {
      const reason = !sourceCheck ? 'inexistente' : 'desativada';
      console.log(`[web-scraper] Source ${reason}: ${sourceName}`);
      return createErrorResponse(
        corsHeaders,
        `Fonte ${reason}. ${!sourceCheck ? 'Cadastre' : 'Ative'} a fonte no Catálogo de Fontes.`,
        403
      );
    }

    // Lookup group_id from source_group_assignments
    const { data: groupAssignment } = await supabase
      .from('source_group_assignments')
      .select('group_id')
      .eq('source_id', sourceCheck.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const groupId = groupAssignment?.group_id || null;

    console.log(`[web-scraper] Starting scrape: ${url}`);

    // Load user_settings and tombstones
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

    // Fetch with timeout and security options
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual', // Don't follow redirects automatically (SSRF protection)
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadarBrasis/1.0)',
      },
    });
    clearTimeout(timeout);

    // Check for redirects (potential SSRF)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectValidation = isValidUrl(location);
        if (!redirectValidation.valid) {
          return createErrorResponse(corsHeaders, 'Redirecionamento não permitido', 403, 'Unsafe redirect', location);
        }
      }
      return createErrorResponse(corsHeaders, 'Redirecionamento não suportado', 400);
    }

    if (!response.ok) {
      return createErrorResponse(corsHeaders, 'Erro ao acessar URL', 502, 'Fetch failed', response.status);
    }

    // Check content length before reading (memory protection)
    const contentLength = response.headers.get('content-length');
    const MAX_HTML_SIZE = 5_000_000; // 5MB limit
    if (contentLength && parseInt(contentLength) > MAX_HTML_SIZE) {
      return createErrorResponse(corsHeaders, 'Conteúdo muito grande', 413, 'Content too large', contentLength);
    }

    const html = await response.text();
    
    // Double-check actual size
    if (html.length > MAX_HTML_SIZE) {
      return createErrorResponse(corsHeaders, 'Conteúdo muito grande', 413, 'HTML too large', html.length);
    }

    const { title: pageTitle, items } = await extractContent(html, url);

    console.log(`[web-scraper] Extracted ${items.length} items from ${pageTitle}`);

    let itemsSaved = 0;
    const results = [];

    for (const item of items) {
      // Skip if permanently deleted
      if (tombstoneLinks.has(item.link)) {
        results.push({ title: item.title, saved: false, reason: 'Excluído anteriormente' });
        continue;
      }

      // Analyze relevance with AI
      const { relevancia, tags } = await analyzeRelevance(item.title, item.content, editoria);

      // Apply user threshold
      if (relevancia >= minRelevance) {
        const { error } = await supabase
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
          console.error('[web-scraper] Error saving item:', error.message);
          results.push({ title: item.title, relevancia, saved: false, reason: 'Erro ao salvar' });
        }
      } else {
        results.push({ title: item.title, relevancia, saved: false, reason: 'Baixa relevância' });
      }
    }

    console.log(`[web-scraper] Saved ${itemsSaved} of ${items.length} items`);

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
    console.error('[web-scraper] Unhandled error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar solicitação. Tente novamente.',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
