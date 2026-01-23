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

// Security: generic error messages for client
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

// Initialize Supabase client
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
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[radar-automation] Starting RSS collection...');
    const startTime = Date.now();
    
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    // Create service role client for cron jobs
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Authenticated user call
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          detectSessionInUrl: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });
      
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      
      if (!authError && user) {
        userId = user.id;
        console.log(`[radar-automation] Authenticated user: ${userId}`);
      }
    }
    
    // If no authenticated user, this might be a cron job - process all active users
    if (!userId) {
      console.log('[radar-automation] No authenticated user - running as cron job for all users');
      
      if (!serviceRoleKey) {
        return createErrorResponse(corsHeaders, 'Configuração do servidor incompleta', 500, 'Missing service role key');
      }
      
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          detectSessionInUrl: false,
          persistSession: false
        }
      });
      
      // Get all unique user IDs that have active RSS sources
      const { data: activeUsers, error: usersError } = await supabaseAdmin
        .from('radar_sources')
        .select('user_id')
        .eq('active', true)
        .eq('type', 'RSS');
      
      if (usersError || !activeUsers || activeUsers.length === 0) {
        console.log('[radar-automation] No active users with RSS sources');
        return new Response(
          JSON.stringify({ message: 'Nenhum usuário com fontes RSS ativas', processedSources: 0, savedItems: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Get unique user IDs
      const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))];
      console.log(`[radar-automation] Processing ${uniqueUserIds.length} users in cron mode`);
      
      let totalProcessed = 0;
      let totalSaved = 0;
      
      for (const cronUserId of uniqueUserIds) {
        try {
          const result = await processUserRSS(supabaseAdmin, cronUserId, corsHeaders);
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
          message: 'Coleta RSS (cron) concluída',
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
      auth: {
        detectSessionInUrl: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader!,
        },
      },
    });
    console.log(`[radar-automation] Processing for user: ${userId}`);
    
    const result = await processUserRSS(supabase, userId, corsHeaders);
    const totalTime = Date.now() - startTime;
    
    // Count today's items
    const { data: todayItems } = await supabase
      .from('radar_brasis')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    
    const todayTotalItems = todayItems?.length || 0;
    
    console.log(`[radar-automation] Completed in ${totalTime}ms: ${result.processedSources} sources, ${result.savedItems} items`);

    return new Response(
      JSON.stringify({
        message: 'Coleta RSS concluída com sucesso',
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

// Process RSS for a single user
async function processUserRSS(supabase: ReturnType<typeof createClient>, userId: string, corsHeaders: Record<string, string>) {
  // Load configurations in batch
  const [keywordsResult, weightsResult, settingsResult] = await Promise.all([
    supabase
      .from('radar_keywords')
      .select('category_name, keywords, weight')
      .eq('user_id', userId),
    supabase
      .from('editorial_weights')
      .select('editoria, multiplier')
      .eq('user_id', userId),
    supabase
      .from('user_settings')
      .select('min_relevance_threshold')
      .eq('user_id', userId)
      .maybeSingle()
  ]);

  const userKeywords = keywordsResult.data || [];
  const userEditorialWeights = weightsResult.data || [];
  const minThreshold = settingsResult.data?.min_relevance_threshold || 3;

  // Fetch user's active RSS sources
  const { data: sources, error: sourcesError } = await supabase
    .from('radar_sources')
    .select('id, name, url, type, active, config, external_api_config, last_sync, created_at, updated_at, user_id')
    .eq('active', true)
    .eq('type', 'RSS')
    .eq('user_id', userId);

  if (sourcesError || !sources || sources.length === 0) {
    console.log(`[radar-automation] No active RSS sources for user ${userId}`);
    return { processedSources: 0, savedItems: 0, minThreshold };
  }

  console.log(`[radar-automation] Processing ${sources.length} RSS sources for user ${userId}`);
  
  // Load tombstones
  const { data: tombstones } = await supabase
    .from('radar_tombstones')
    .select('link')
    .eq('user_id', userId);

  const tombstoneLinks = new Set(
    tombstones?.map((t: { link: string }) => t.link) || []
  );
  
  let totalSavedItems = 0;
  let processedSources = 0;

  // Process each RSS source
  for (const source of sources) {
    try {
      console.log(`[radar-automation] Processing: ${source.name}`);
      
      // Normalize URL
      let normalizedUrl = source.url.trim();
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      
      // SSRF Protection
      if (!isUrlSafe(normalizedUrl)) {
        console.error(`[radar-automation] URL blocked by security policy: ${source.name}`);
        continue;
      }
      
      // Fetch RSS feed
      const rssResponse = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Radar Brasis RSS Collector 1.0'
        }
      });

      if (!rssResponse.ok) {
        console.error(`[radar-automation] RSS fetch failed for ${source.name}: ${rssResponse.status}`);
        continue;
      }

      const rssText = await rssResponse.text();
      const items = parseRSSFeed(rssText, source.name);
      
      console.log(`[radar-automation] Found ${items.length} items in ${source.name}`);

      // Save new items
      for (const item of items) {
        try {
          // Skip if permanently deleted
          if (item.link && tombstoneLinks.has(item.link)) {
            continue;
          }

          // Check for duplicates
          const { data: existing } = await supabase
            .from('radar_brasis')
            .select('id')
            .eq('link', item.link)
            .eq('user_id', userId)
            .maybeSingle();

          if (existing) {
            continue;
          }

          // Extract tags and calculate relevance
          const extractedTags = extractKeywords(item.title + ' ' + item.description);
          const keywordScore = calculateKeywordRelevance(item, extractedTags, userKeywords);
          const editoria = determineEditoria(item);
          const multiplier = getEditorialMultiplier(editoria, userEditorialWeights);
          const finalScore = Math.max(1, Math.min(5, keywordScore * multiplier));
          
          // Apply threshold filter
          if (finalScore < minThreshold) {
            continue;
          }

          // Insert new item
          const { error: insertError } = await supabase
            .from('radar_brasis')
            .insert({
              user_id: userId,
              title: item.title.substring(0, 500),
              link: item.link,
              source: item.source,
              pub_date: item.pubDate || new Date().toISOString(),
              editoria: editoria,
              input_bruto: item.description.substring(0, 1000),
              tags: extractedTags,
              relevancia: Math.round(finalScore),
              status: 'Em aprovação'
            });

          if (insertError) {
            console.error(`[radar-automation] Insert error:`, insertError.message);
          } else {
            totalSavedItems++;
          }
        } catch (itemError) {
          console.error(`[radar-automation] Item processing error:`, itemError);
        }
      }

      processedSources++;
      
      // Update last_sync timestamp
      await supabase
        .from('radar_sources')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', source.id);

    } catch (sourceError) {
      console.error(`[radar-automation] Source error ${source.name}:`, sourceError);
    }
  }

  return { processedSources, savedItems: totalSavedItems, minThreshold };
}

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

      items.push({
        title: sanitizeText(title.trim()),
        link: link.trim(),
        description: sanitizeText(cleanDescription),
        pubDate,
        source: sourceName
      });
    }
  } catch (parseError) {
    console.error('[radar-automation] RSS parse error:', parseError);
  }
  
  return items;
}

function extractXMLContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function isUrlSafe(url: string): boolean {
  try {
    // URL length limit
    if (url.length > 2048) {
      return false;
    }

    const parsedUrl = new URL(url);
    
    // Only HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Hostname length limit
    if (parsedUrl.hostname.length > 253) {
      return false;
    }
    
    // Block private/local networks
    const hostname = parsedUrl.hostname.toLowerCase();
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }
    
    if (hostname.match(/^10\./) || 
        hostname.match(/^192\.168\./) || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) ||
        hostname.match(/^169\.254\./) ||
        hostname.match(/^fc00:/) ||
        hostname.match(/^fe80:/) ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

function extractKeywords(text: string): string[] {
  const commonWords = ['o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde'];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 10);
    
  return [...new Set(words)];
}

function calculateKeywordRelevance(item: RSSItem, extractedTags: string[], userKeywords: { category_name: string; keywords: string[]; weight: number }[]): number {
  if (!userKeywords || userKeywords.length === 0) {
    return 1;
  }
  
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
    
    if (categoryMatched) {
      totalScore += categoryWeight;
    }
  }
  
  return Math.max(1, Math.min(5, totalScore));
}

function determineEditoria(item: RSSItem): string {
  const text = `${item.title} ${item.description}`.toLowerCase();
  
  const editoriaKeywords = {
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
    if (keywords.some(keyword => text.includes(keyword))) {
      return editoria;
    }
  }
  
  return 'Geral';
}

function getEditorialMultiplier(editoria: string, editorialWeights: { editoria: string; multiplier: number }[]): number {
  const weight = editorialWeights.find(w => w.editoria === editoria);
  return weight ? Number(weight.multiplier) : 1.0;
}

function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}
