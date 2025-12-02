import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    console.log('🚀 Iniciando coleta automática de RSS...');
    const startTime = Date.now();
    
    // ⚡ OTIMIZAÇÃO 3: Eliminar JWT redundante - Supabase já valida via verify_jwt=true
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token JWT não fornecido');
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    // Criar client autenticado diretamente (JWT já validado por config.toml)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader, // Passar token diretamente
        },
      },
    });
    
    // Obter usuário do contexto autenticado (remove 200ms+ de latência)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError?.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    const userId = user.id;
    console.log(`👤 Processando para usuário: ${userId}`);
    
    // Performance: carregar configurações em batch
    const configStart = Date.now();
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
    
    console.log(`⚡ Config carregada em ${Date.now() - configStart}ms: ${userKeywords.length} categorias, ${userEditorialWeights.length} multiplicadores, threshold ${minThreshold}`);

    // Fetch user's active RSS sources (excluindo credentials por segurança)
    const { data: sources, error: sourcesError } = await supabase
      .from('radar_sources')
      .select('id, name, url, type, active, config, external_api_config, last_sync, created_at, updated_at, user_id')
      .eq('active', true)
      .eq('type', 'RSS')
      .eq('user_id', userId);

    if (sourcesError) {
      console.error('❌ Erro ao buscar fontes:', sourcesError);
      throw sourcesError;
    }

    if (!sources || sources.length === 0) {
      console.log('⚠️ Nenhuma fonte RSS ativa encontrada para o usuário');
      return new Response(
        JSON.stringify({ message: 'Nenhuma fonte RSS ativa encontrada para este usuário', processedSources: 0, savedItems: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`📡 Processando ${sources.length} fontes RSS para o usuário...`);
    
    // Carregar tombstones (itens excluídos permanentemente)
    const { data: tombstones } = await supabase
      .from('radar_tombstones')
      .select('link')
      .eq('user_id', userId);

    const tombstoneLinks = new Set(
      tombstones?.map((t: { link: string }) => t.link) || []
    );
    console.log(`🪦 ${tombstoneLinks.size} links excluídos permanentemente`);
    
    let totalSavedItems = 0;
    let processedSources = 0;

    // Process each RSS source
    for (const source of sources) {
      try {
        console.log(`🔄 Processando fonte: ${source.name} (${source.url})`);
        
        // Normalize URL - ensure it has protocol
        let normalizedUrl = source.url.trim();
        if (!normalizedUrl.match(/^https?:\/\//i)) {
          normalizedUrl = `https://${normalizedUrl}`;
          console.log(`🔗 URL normalizada: ${normalizedUrl}`);
        }
        
        // SSRF Protection: validate URL
        if (!isUrlSafe(normalizedUrl)) {
          console.error(`🚫 URL rejeitada por política de segurança: ${normalizedUrl}`);
          continue;
        }
        
        // Fetch RSS feed
        const rssResponse = await fetch(normalizedUrl, {
          headers: {
            'User-Agent': 'Radar Brasis RSS Collector 1.0'
          }
        });

        if (!rssResponse.ok) {
          console.error(`❌ Erro ao buscar RSS ${source.name}: ${rssResponse.status}`);
          continue;
        }

        const rssText = await rssResponse.text();
        const items = parseRSSFeed(rssText, source.name);
        
        console.log(`📄 ${items.length} itens encontrados em ${source.name}`);

        // Save new items to database
        for (const item of items) {
          try {
            // Pular se foi excluído permanentemente
            if (item.link && tombstoneLinks.has(item.link)) {
              console.log(`⏭️ Pulando item excluído anteriormente: ${item.title.substring(0, 50)}...`);
              continue;
            }

            // Check if item already exists for this user (avoid duplicates)
            const { data: existing } = await supabase
              .from('radar_brasis')
              .select('id')
              .eq('link', item.link)
              .eq('user_id', userId)
              .maybeSingle();

            if (existing) {
              console.log(`⏭️ Item já existe: ${item.title.substring(0, 50)}...`);
              continue;
            }

            // Extract tags and calculate relevance
            const extractedTags = extractKeywords(item.title + ' ' + item.description);
            const keywordScore = calculateKeywordRelevance(item, extractedTags, userKeywords);
            
            // Try to determine editoria from item content
            const editoria = determineEditoria(item);
            
            // Apply editorial multiplier
            const multiplier = getEditorialMultiplier(editoria, userEditorialWeights);
            const finalScore = Math.max(1, Math.min(5, keywordScore * multiplier));
            
            // ⚡ OTIMIZAÇÃO: aplicar filtro antes de qualquer processamento DB
            if (finalScore < minThreshold) {
              console.log(`⏭️ Item rejeitado por threshold: ${finalScore.toFixed(1)} < ${minThreshold}`);
              continue;
            }
            
            console.log(`📝 Item aceito: ${item.title.substring(0, 50)}... | Editoria: ${editoria} | Score: ${finalScore.toFixed(1)}`);
            

            // Insert new item with correct schema
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
              console.error(`❌ Erro ao inserir item: ${insertError.message}`);
            } else {
              console.log(`✅ Item salvo: ${item.title.substring(0, 50)}...`);
              totalSavedItems++;
            }
          } catch (itemError) {
            console.error(`❌ Erro ao processar item individual:`, itemError);
          }
        }

        processedSources++;
        
        // Update source last_sync timestamp
        await supabase
          .from('radar_sources')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', source.id);

      } catch (sourceError) {
        console.error(`❌ Erro ao processar fonte ${source.name}:`, sourceError);
      }
    }

    // Count today's filtered items for reporting
    const { data: todayItems } = await supabase
      .from('radar_brasis')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    
    const todayTotalItems = todayItems?.length || 0;
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Coleta concluída em ${totalTime}ms: ${processedSources} fontes processadas, ${totalSavedItems} novos itens salvos`);

    return new Response(
      JSON.stringify({
        message: 'Coleta RSS concluída com sucesso',
        processedSources,
        savedItems: totalSavedItems,
        todayTotalItems,
        minThreshold,
        performance: {
          totalTimeMs: totalTime,
          avgTimePerSource: Math.round(totalTime / Math.max(1, processedSources)),
          efficiency: Math.round((totalSavedItems / Math.max(1, todayTotalItems)) * 100)
        },
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro geral na coleta RSS:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno na coleta RSS',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function parseRSSFeed(xmlText: string, sourceName: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  try {
    // Basic XML parsing for RSS feeds
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches) {
      const title = extractXMLContent(itemXml, 'title') || 'Sem título';
      const link = extractXMLContent(itemXml, 'link') || '#';
      const description = extractXMLContent(itemXml, 'description') || '';
      const pubDate = extractXMLContent(itemXml, 'pubDate') || new Date().toISOString();
      
      // Clean HTML from description
      const cleanDescription = description
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      items.push({
        title: title.trim(),
        link: link.trim(),
        description: cleanDescription,
        pubDate,
        source: sourceName
      });
    }
  } catch (parseError) {
    console.error('❌ Erro ao fazer parse do XML RSS:', parseError);
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
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block private/local networks and localhost
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }
    
    // Block private IP ranges (basic check)
    if (hostname.match(/^10\./) || 
        hostname.match(/^192\.168\./) || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) ||
        hostname.match(/^169\.254\./) || // Link-local
        hostname.match(/^fc00:/) || // IPv6 unique local
        hostname.match(/^fe80:/)) { // IPv6 link-local
      return false;
    }
    
    return true;
  } catch {
    return false; // Invalid URL
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - remove common words and extract meaningful terms
  const commonWords = ['o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde'];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords
    
  return [...new Set(words)]; // Remove duplicates
}

function calculateKeywordRelevance(item: RSSItem, extractedTags: string[], userKeywords: any[]): number {
  if (!userKeywords || userKeywords.length === 0) {
    return 1; // Default relevance if no keywords configured
  }
  
  const text = `${item.title} ${item.description}`.toLowerCase();
  const tags = extractedTags.map(tag => tag.toLowerCase());
  
  let totalScore = 0;
  
  for (const category of userKeywords) {
    const categoryKeywords = category.keywords || [];
    const categoryWeight = category.weight || 1;
    
    let categoryMatched = false;
    
    // Check if any keyword from this category is present
    for (const keyword of categoryKeywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Check in text content
      if (text.includes(keywordLower)) {
        categoryMatched = true;
        break;
      }
      
      // Check in extracted tags
      if (tags.some(tag => tag.includes(keywordLower))) {
        categoryMatched = true;
        break;
      }
    }
    
    if (categoryMatched) {
      totalScore += categoryWeight;
    }
  }
  
  // Return raw score (will be multiplied by editorial weight later)
  return Math.max(1, Math.min(5, totalScore));
}

function determineEditoria(item: RSSItem): string {
  const text = `${item.title} ${item.description}`.toLowerCase();
  
  // Simple keyword-based editorial classification
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
  
  return 'Geral'; // Default editoria
}

function getEditorialMultiplier(editoria: string, editorialWeights: any[]): number {
  const weight = editorialWeights.find(w => w.editoria === editoria);
  return weight ? Number(weight.multiplier) : 1.0; // Default multiplier
}