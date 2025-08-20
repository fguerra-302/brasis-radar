import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando coleta automática de RSS...');
    
    // Get JWT token from Authorization header
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

    const token = authHeader.substring(7);
    
    // Create authenticated Supabase client for this user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Token JWT inválido:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    const userId = user.id;
    console.log(`👤 Processando para usuário: ${userId}`);
    
    // Fetch user's active RSS sources
    const { data: sources, error: sourcesError } = await supabase
      .from('radar_sources')
      .select('*')
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

            // Insert new item with correct schema
            const { error: insertError } = await supabase
              .from('radar_brasis')
              .insert({
                user_id: userId,
                title: item.title.substring(0, 500),
                link: item.link,
                source: item.source,
                pub_date: item.pubDate || new Date().toISOString(),
                input_bruto: item.description.substring(0, 1000),
                tags: extractKeywords(item.title + ' ' + item.description),
                status: 'A curar'
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

    console.log(`✅ Coleta concluída: ${processedSources} fontes processadas, ${totalSavedItems} novos itens salvos`);

    return new Response(
      JSON.stringify({
        message: 'Coleta RSS concluída com sucesso',
        processedSources,
        savedItems: totalSavedItems,
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