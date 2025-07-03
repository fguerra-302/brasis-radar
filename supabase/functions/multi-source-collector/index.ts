import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId, sourceType, config } = await req.json();
    
    console.log(`🚀 Coletando dados de ${sourceType}...`);

    let result = { success: false, items_collected: 0, errors: [] };

    switch (sourceType) {
      case 'INSTAGRAM':
        result = await collectInstagramData(config);
        break;
      case 'SPOTIFY':
        result = await collectSpotifyData(config);
        break;
      case 'IBGE':
        result = await collectIBGEData(config);
        break;
      default:
        throw new Error(`Tipo de fonte não suportado: ${sourceType}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na coleta:', error);
    return new Response(JSON.stringify({
      success: false,
      items_collected: 0,
      errors: [error.message]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function collectInstagramData(config: any) {
  const accessToken = Deno.env.get('META_CONTENT_LIBRARY_TOKEN');
  
  if (!accessToken) {
    return {
      success: false,
      items_collected: 0,
      errors: ['Meta Content Library Token não configurado']
    };
  }

  try {
    // Usar Meta Content Library API para buscar contas relacionadas ao Brasil
    const searchQuery = config.search_terms || 'brasil OR brazil OR brazilian';
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/content_library/search/instagram_accounts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: searchQuery,
          limit: 20
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Meta Content Library API error: ${response.status}`);
    }

    const data = await response.json();
    const accounts = data.data || [];

    const processedItems = [];
    
    // Para cada conta encontrada, buscar posts recentes
    for (const account of accounts.slice(0, 5)) {
      try {
        const postsResponse = await fetch(
          `https://graph.facebook.com/v18.0/content_library/search/instagram_posts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              instagram_account_id: account.id,
              limit: 5,
              since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Última semana
            })
          }
        );

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          const posts = postsData.data || [];

          for (const post of posts) {
            if (post.text && post.text.length > 10) {
              const item = {
                title: post.text.substring(0, 100) + '...',
                link: post.permalink || `https://instagram.com/p/${post.shortcode}`,
                source: `Instagram - ${account.username || account.name}`,
                pub_date: post.timestamp,
                editoria: 'Social',
                tags: ['instagram', 'social', 'brasil', 'meta-content-library'],
                relevancia: post.like_count > 1000 ? 4 : 3,
                status: 'A curar',
                resumo_curado: post.text,
                input_bruto: JSON.stringify({
                  post: post,
                  account: account,
                  metrics: {
                    likes: post.like_count,
                    comments: post.comments_count,
                    followers: account.follower_count
                  }
                })
              };

              // Verificar se já existe
              const { data: existing } = await supabase
                .from('radar_brasis')
                .select('id')
                .eq('link', item.link)
                .single();

              if (!existing) {
                processedItems.push(item);
              }
            }
          }
        }
      } catch (postError) {
        console.error(`Erro ao buscar posts da conta ${account.id}:`, postError);
      }
    }

    // Salvar novos itens
    if (processedItems.length > 0) {
      const { error } = await supabase
        .from('radar_brasis')
        .insert(processedItems);

      if (error) throw error;
    }

    return {
      success: true,
      items_collected: processedItems.length,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      items_collected: 0,
      errors: [error.message]
    };
  }
}

async function collectSpotifyData(config: any) {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    return {
      success: false,
      items_collected: 0,
      errors: ['Spotify credenciais não configuradas']
    };
  }

  try {
    // Obter token de acesso
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Buscar playlists com termo "Brasil"
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=brasil&type=playlist&market=BR&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const searchData = await searchResponse.json();
    const playlists = searchData.playlists?.items || [];

    const processedItems = [];
    for (const playlist of playlists) {
      const item = {
        title: `Playlist: ${playlist.name}`,
        link: playlist.external_urls.spotify,
        source: 'Spotify',
        pub_date: new Date().toISOString(),
        editoria: 'Cultura',
        tags: ['spotify', 'música', 'brasil'],
        relevancia: 2,
        status: 'A curar',
        resumo_curado: playlist.description || `Playlist brasileira: ${playlist.name}`,
        input_bruto: JSON.stringify(playlist)
      };

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('radar_brasis')
        .select('id')
        .eq('link', playlist.external_urls.spotify)
        .single();

      if (!existing) {
        processedItems.push(item);
      }
    }

    // Salvar novos itens
    if (processedItems.length > 0) {
      const { error } = await supabase
        .from('radar_brasis')
        .insert(processedItems);

      if (error) throw error;
    }

    return {
      success: true,
      items_collected: processedItems.length,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      items_collected: 0,
      errors: [error.message]
    };
  }
}

async function collectIBGEData(config: any) {
  try {
    const service = config.ibge_service || 'noticias';
    const apiUrl = `https://servicodados.ibge.gov.br/api/v3/${service}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`IBGE API error: ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : data.items || [];

    const processedItems = [];
    for (const item of items.slice(0, 10)) {
      const processedItem = {
        title: item.titulo || item.nome || 'Dado IBGE',
        link: item.link || `https://ibge.gov.br/estatisticas`,
        source: 'IBGE',
        pub_date: item.data_publicacao || new Date().toISOString(),
        editoria: 'Regional',
        tags: ['ibge', 'dados', 'brasil', 'estatística'],
        relevancia: 3,
        status: 'A curar',
        resumo_curado: item.introducao || item.resumo || `Dados oficiais do IBGE`,
        input_bruto: JSON.stringify(item)
      };

      // Verificar se já existe (usar título como identificador único)
      const { data: existing } = await supabase
        .from('radar_brasis')
        .select('id')
        .eq('title', processedItem.title)
        .eq('source', 'IBGE')
        .single();

      if (!existing) {
        processedItems.push(processedItem);
      }
    }

    // Salvar novos itens
    if (processedItems.length > 0) {
      const { error } = await supabase
        .from('radar_brasis')
        .insert(processedItems);

      if (error) throw error;
    }

    return {
      success: true,
      items_collected: processedItems.length,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      items_collected: 0,
      errors: [error.message]
    };
  }
}