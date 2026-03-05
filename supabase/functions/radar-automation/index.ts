import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://3d99c837-5852-4c57-9505-d2ca60666732.lovableproject.com',
  'https://vlsirftmzvmilugalbpr.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function createErrorResponse(
  corsHeaders: Record<string, string>,
  userMessage: string,
  status: number,
  internalContext?: string,
  internalError?: unknown
) {
  if (internalContext) {
    console.error(`[radar-automation] ${internalContext}:`, internalError || userMessage);
  }
  return new Response(
    JSON.stringify({ error: userMessage }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[radar-automation] Starting collection...');
    const startTime = Date.now();
    
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    let userId: string | null = null;
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Security: require either valid auth header or valid cron secret
    if (!authHeader?.startsWith('Bearer ') && cronSecret !== Deno.env.get('CRON_SECRET')) {
      return createErrorResponse(corsHeaders, 'Unauthorized', 401, 'Missing auth header and invalid cron secret');
    }
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { detectSessionInUrl: false, persistSession: false },
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (!authError && user) {
        userId = user.id;
        console.log(`[radar-automation] Authenticated user: ${userId}`);
      }
    }
    
    if (!userId) {
      console.log('[radar-automation] Running as cron job for all users');
      
      if (!serviceRoleKey) {
        return createErrorResponse(corsHeaders, 'Configuração do servidor incompleta', 500, 'Missing service role key');
      }
      
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { detectSessionInUrl: false, persistSession: false }
      });
      
      // Get all users from user_settings (every active user has a record)
      const { data: activeUsers, error: usersError } = await supabaseAdmin
        .from('user_settings')
        .select('user_id');
      
      if (usersError || !activeUsers || activeUsers.length === 0) {
        console.log('[radar-automation] No active users found in user_settings');
        return new Response(
          JSON.stringify({ message: 'Nenhum usuário ativo encontrado', processedSources: 0, savedItems: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))];
      console.log(`[radar-automation] Processing ${uniqueUserIds.length} users in cron mode`);
      
      let totalProcessed = 0;
      let totalSaved = 0;
      
      for (const cronUserId of uniqueUserIds) {
        try {
          const result = await processUser(supabaseAdmin, cronUserId);
          totalProcessed += result.processedSources;
          totalSaved += result.savedItems;
        } catch (userError) {
          console.error(`[radar-automation] Error processing user ${cronUserId}:`, userError);
        }
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`[radar-automation] Cron completed in ${totalTime}ms: ${totalProcessed} sources, ${totalSaved} items for ${uniqueUserIds.length} users`);
      
      return new Response(
        JSON.stringify({
          message: 'Coleta (cron) concluída',
          usersProcessed: uniqueUserIds.length,
          processedSources: totalProcessed,
          savedItems: totalSaved,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Process single authenticated user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { detectSessionInUrl: false, persistSession: false },
      global: { headers: { Authorization: authHeader! } },
    });
    
    const result = await processUser(supabase, userId);
    const totalTime = Date.now() - startTime;
    
    const { data: todayItems } = await supabase
      .from('radar_brasis')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    
    const todayTotalItems = todayItems?.length || 0;
    
    console.log(`[radar-automation] Completed in ${totalTime}ms: ${result.processedSources} sources, ${result.savedItems} items`);

    return new Response(
      JSON.stringify({
        message: 'Coleta concluída com sucesso',
        processedSources: result.processedSources,
        savedItems: result.savedItems,
        todayTotalItems,
        minThreshold: result.minThreshold,
        performance: {
          totalTimeMs: totalTime,
          avgTimePerSource: Math.round(totalTime / Math.max(1, result.processedSources)),
          efficiency: Math.round((result.savedItems / Math.max(1, todayTotalItems)) * 100)
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[radar-automation] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar coleta. Tente novamente.' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Process all source types for a single user
async function processUser(supabase: any, userId: string) {
  // Create admin client to read shared_sources (no user_id / RLS bypass)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const adminClient = serviceRoleKey 
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { detectSessionInUrl: false, persistSession: false } })
    : supabase;

  // Load configurations in batch
  const [keywordsResult, weightsResult, settingsResult, sourcesResult] = await Promise.all([
    supabase.from('radar_keywords').select('category_name, keywords, weight').eq('user_id', userId),
    supabase.from('editorial_weights').select('editoria, multiplier').eq('user_id', userId),
    supabase.from('user_settings').select('min_relevance_threshold').eq('user_id', userId).maybeSingle(),
    adminClient.from('shared_sources').select('id, name, url, type, active, config').eq('active', true).in('type', ['RSS', 'WEB'])
  ]);

  const userKeywords = keywordsResult.data || [];
  const userEditorialWeights = weightsResult.data || [];
  const minThreshold = settingsResult.data?.min_relevance_threshold || 3;

  // Load tombstones
  const { data: tombstones } = await supabase
    .from('radar_tombstones')
    .select('link')
    .eq('user_id', userId);
  const tombstoneLinks = new Set(tombstones?.map((t: { link: string }) => t.link) || []);

  const allSources = sourcesResult.data || [];
  const sourcesError = sourcesResult.error;

  if (sourcesError || allSources.length === 0) {
    console.log(`[radar-automation] No active shared sources found`);
    return { processedSources: 0, savedItems: 0, minThreshold };
  }

  const rssSources = allSources.filter((s: any) => s.type === 'RSS');
  const webSources = allSources.filter((s: any) => s.type === 'WEB');

  let totalSavedItems = 0;
  let processedSources = 0;

  // ===== Process RSS sources =====
  if (rssSources.length > 0) {
    console.log(`[radar-automation] Processing ${rssSources.length} RSS sources for user ${userId}`);
    for (const source of rssSources) {
      try {
        console.log(`[radar-automation] Processing: ${source.name}`);
        
        let normalizedUrl = source.url.trim();
        if (!normalizedUrl.match(/^https?:\/\//i)) {
          normalizedUrl = `https://${normalizedUrl}`;
        }
        
        if (!isUrlSafe(normalizedUrl)) {
          console.error(`[radar-automation] URL blocked by security policy: ${source.name}`);
          continue;
        }
        
        const rssResponse = await fetch(normalizedUrl, {
          headers: { 'User-Agent': 'Radar Brasis RSS Collector 1.0' }
        });

        if (!rssResponse.ok) {
          console.error(`[radar-automation] RSS fetch failed for ${source.name}: ${rssResponse.status}`);
          continue;
        }

        const rssText = await rssResponse.text();
        const items = parseRSSFeed(rssText, source.name);
        console.log(`[radar-automation] Found ${items.length} items in ${source.name}`);

        for (const item of items) {
          try {
            if (item.link && tombstoneLinks.has(item.link)) continue;

            const { data: existing } = await supabase
              .from('radar_brasis')
              .select('id')
              .eq('link', item.link)
              .eq('user_id', userId)
              .maybeSingle();
            if (existing) continue;

            const extractedTags = extractKeywords(item.title + ' ' + item.description);
            const keywordScore = calculateKeywordRelevance(item, extractedTags, userKeywords);
            const editoria = determineEditoria(item);
            const multiplier = getEditorialMultiplier(editoria, userEditorialWeights);
            const finalScore = Math.max(1, Math.min(5, keywordScore * multiplier));
            
            if (finalScore < minThreshold) continue;

            const { error: insertError } = await supabase.from('radar_brasis').insert({
              user_id: userId,
              title: item.title.substring(0, 500),
              link: item.link,
              source: item.source,
              pub_date: item.pubDate || new Date().toISOString(),
              editoria,
              input_bruto: item.description.substring(0, 1000),
              tags: extractedTags,
              relevancia: Math.round(finalScore),
              status: 'Coletado'
            });

            if (!insertError) totalSavedItems++;
            else console.error(`[radar-automation] Insert error:`, insertError.message);
          } catch (itemError) {
            console.error(`[radar-automation] Item processing error:`, itemError);
          }
        }

        processedSources++;
      } catch (sourceError) {
        console.error(`[radar-automation] Source error ${source.name}:`, sourceError);
      }
    }
  }

  // ===== Process WEB sources (scraping via Firecrawl) =====
  if (webSources.length > 0) {
    console.log(`[radar-automation] Processing ${webSources.length} WEB sources for user ${userId}`);
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      console.warn('[radar-automation] FIRECRAWL_API_KEY not configured, skipping WEB sources');
    } else {
      for (const source of webSources) {
        try {
          const editoria = source.config?.editoria || 'Geral';
          console.log(`[radar-automation] Scraping WEB: ${source.name} (${editoria})`);

          let normalizedUrl = source.url.trim();
          if (!normalizedUrl.match(/^https?:\/\//i)) {
            normalizedUrl = `https://${normalizedUrl}`;
          }
          if (!isUrlSafe(normalizedUrl)) {
            console.error(`[radar-automation] URL blocked: ${source.name}`);
            continue;
          }

          // Use Firecrawl to scrape the page
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: normalizedUrl,
              formats: ['markdown', 'links'],
              onlyMainContent: true,
            }),
          });

          if (!scrapeResponse.ok) {
            console.error(`[radar-automation] Firecrawl scrape failed for ${source.name}: ${scrapeResponse.status}`);
            continue;
          }

          const scrapeData = await scrapeResponse.json();
          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const pageLinks = scrapeData.data?.links || scrapeData.links || [];
          const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

          if (!markdown) {
            console.log(`[radar-automation] No content from ${source.name}`);
            continue;
          }

          // Split markdown into sections by headers
          const sections = splitMarkdownSections(markdown, source.name, normalizedUrl, pageLinks);
          console.log(`[radar-automation] Extracted ${sections.length} sections from ${source.name}`);

          for (const section of sections.slice(0, 15)) {
            try {
              if (tombstoneLinks.has(section.link)) continue;

              const { data: existing } = await supabase
                .from('radar_brasis')
                .select('id')
                .eq('link', section.link)
                .eq('user_id', userId)
                .maybeSingle();
              if (existing) continue;

              const extractedTags = extractKeywords(section.title + ' ' + section.content);
              const rssItem: RSSItem = {
                title: section.title,
                link: section.link,
                description: section.content,
                pubDate: new Date().toISOString(),
                source: source.name,
              };
              const keywordScore = calculateKeywordRelevance(rssItem, extractedTags, userKeywords);
              const multiplier = getEditorialMultiplier(editoria, userEditorialWeights);
              const finalScore = Math.max(1, Math.min(5, keywordScore * multiplier));

              if (finalScore < minThreshold) continue;

              const { error: insertError } = await supabase.from('radar_brasis').insert({
                user_id: userId,
                title: section.title.substring(0, 500),
                link: section.link,
                source: source.name,
                pub_date: new Date().toISOString(),
                editoria,
                input_bruto: section.content.substring(0, 1000),
                tags: extractedTags,
                relevancia: Math.round(finalScore),
                status: 'Coletado'
              });

              if (!insertError) totalSavedItems++;
              else console.error(`[radar-automation] WEB insert error:`, insertError.message);
            } catch (itemError) {
              console.error(`[radar-automation] WEB item error:`, itemError);
            }
          }

          processedSources++;
        } catch (sourceError) {
          console.error(`[radar-automation] WEB source error ${source.name}:`, sourceError);
        }
      }
    }
  }

  return { processedSources, savedItems: totalSavedItems, minThreshold };
}

// Split markdown content into titled sections
function splitMarkdownSections(markdown: string, sourceName: string, sourceUrl: string, pageLinks: string[]) {
  const sections: Array<{ title: string; content: string; link: string }> = [];
  const headerRegex = /^#{1,3}\s+(.+)$/gm;
  const matches = [...markdown.matchAll(headerRegex)];

  if (matches.length === 0) {
    // No headers — treat as single item
    const title = markdown.substring(0, 100).replace(/[#\n]/g, '').trim() || sourceName;
    sections.push({ title, content: markdown.substring(0, 1000), link: sourceUrl });
    return sections;
  }

  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : markdown.length;
    const content = markdown.substring(start, end).trim();

    if (content.length < 30) continue; // Skip empty sections

    // Try to find a matching link for this section
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchedLink = pageLinks.find((l: string) =>
      titleWords.some(w => l.toLowerCase().includes(w))
    ) || sourceUrl;

    sections.push({ title, content: content.substring(0, 1000), link: matchedLink });
  }

  return sections;
}

// ===== Existing helper functions =====

function parseRSSFeed(xmlText: string, sourceName: string): RSSItem[] {
  const items: RSSItem[] = [];
  try {
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    for (const itemXml of itemMatches) {
      const title = extractXMLContent(itemXml, 'title') || 'Sem título';
      const link = extractXMLContent(itemXml, 'link') || '#';
      const description = extractXMLContent(itemXml, 'description') || '';
      const pubDate = extractXMLContent(itemXml, 'pubDate') || new Date().toISOString();
      const cleanDescription = description
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      items.push({ title: title.trim(), link: link.trim(), description: cleanDescription, pubDate, source: sourceName });
    }
  } catch (parseError) {
    console.error('[radar-automation] RSS parse error:', parseError);
  }
  return items;
}

function extractXMLContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function isUrlSafe(url: string): boolean {
  try {
    if (url.length > 2048) return false;
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return false;
    if (parsedUrl.hostname.length > 253) return false;
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
    if (hostname.match(/^10\./) || hostname.match(/^192\.168\./) ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) || hostname.match(/^169\.254\./) ||
        hostname.match(/^fc00:/) || hostname.match(/^fe80:/) ||
        hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;
    return true;
  } catch {
    return false;
  }
}

function extractKeywords(text: string): string[] {
  const commonWords = ['o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde'];
  const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word)).slice(0, 10);
  return [...new Set(words)];
}

function calculateKeywordRelevance(item: RSSItem, extractedTags: string[], userKeywords: any[]): number {
  if (!userKeywords || userKeywords.length === 0) return 3;
  const text = `${item.title} ${item.description}`.toLowerCase();
  const tags = extractedTags.map(tag => tag.toLowerCase());
  let totalScore = 0;
  for (const category of userKeywords) {
    const categoryKeywords = category.keywords || [];
    const categoryWeight = category.weight || 1;
    let categoryMatched = false;
    for (const keyword of categoryKeywords) {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower) || tags.some(tag => tag.includes(keywordLower))) {
        categoryMatched = true;
        break;
      }
    }
    if (categoryMatched) totalScore += categoryWeight;
  }
  // Se tem keywords mas nenhuma combinou, dar nota 2 (não 1) para não descartar tão agressivamente
  if (totalScore === 0) return 2;
  return Math.max(1, Math.min(5, totalScore));
}

function determineEditoria(item: RSSItem): string {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const editoriaKeywords: Record<string, string[]> = {
    'Economia': ['economia', 'mercado', 'investimento', 'negócio', 'empresa', 'financeiro', 'dinheiro', 'lucro'],
    'Política': ['governo', 'presidente', 'ministro', 'política', 'eleição', 'congresso', 'senado', 'deputado'],
    'Tecnologia': ['tecnologia', 'internet', 'software', 'app', 'digital', 'computador', 'sistema', 'inovação'],
    'Saúde': ['saúde', 'médico', 'hospital', 'doença', 'tratamento', 'medicamento', 'vacina', 'sus'],
    'Educação': ['educação', 'escola', 'universidade', 'professor', 'aluno', 'ensino', 'curso', 'estudo'],
    'Cultura': ['cultura', 'arte', 'música', 'cinema', 'teatro', 'festival', 'artista', 'livro'],
    'Esporte': ['esporte', 'futebol', 'jogador', 'time', 'olimpíada', 'copa', 'campeonato', 'atleta'],
    'Meio Ambiente': ['ambiente', 'sustentabilidade', 'clima', 'floresta', 'energia', 'poluição', 'verde', 'carbono']
  };
  for (const [editoria, keywords] of Object.entries(editoriaKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) return editoria;
  }
  return 'Geral';
}

function getEditorialMultiplier(editoria: string, editorialWeights: any[]): number {
  const weight = editorialWeights.find(w => w.editoria === editoria);
  return weight ? Number(weight.multiplier) : 1.0;
}
