import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NewsSource } from '@/hooks/useRadarConfig';

interface CollectionResult {
  success: boolean;
  items_collected: number;
  source_name: string;
  errors?: string[];
}

interface CollectionSummary {
  total_sources: number;
  successful_sources: number;
  total_items: number;
  errors: string[];
}

export const useDataCollector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CollectionSummary> => {
      console.log('🚀 Iniciando coleta de dados...');
      
      // Buscar fontes ativas
      const { data: sources, error: sourcesError } = await supabase
        .from('radar_sources')
        .select('*')
        .eq('active', true);

      if (sourcesError) {
        throw new Error(`Erro ao buscar fontes: ${sourcesError.message}`);
      }

      if (!sources || sources.length === 0) {
        throw new Error('Nenhuma fonte ativa encontrada');
      }

      const typedSources = sources as NewsSource[];

      const results: CollectionResult[] = [];
      const summary: CollectionSummary = {
        total_sources: sources.length,
        successful_sources: 0,
        total_items: 0,
        errors: []
      };

      // Processar cada fonte
      for (const source of typedSources) {
        try {
          console.log(`📡 Coletando de: ${source.name} (${source.type})`);
          
          const result = await collectFromSource(source);
          results.push(result);
          
          if (result.success) {
            summary.successful_sources++;
            summary.total_items += result.items_collected;
          } else {
            summary.errors.push(`${source.name}: ${result.errors?.join(', ') || 'Erro desconhecido'}`);
          }
          
          // Delay entre coletas para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Erro ao coletar de ${source.name}:`, error);
          summary.errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      console.log('✅ Coleta concluída:', summary);
      return summary;
    },
    onSuccess: () => {
      // Invalidar dados para recarregar
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};

async function collectFromSource(source: NewsSource): Promise<CollectionResult> {
  const result: CollectionResult = {
    success: false,
    items_collected: 0,
    source_name: source.name,
    errors: []
  };

  try {
    switch (source.type) {
      case 'RSS':
        return await collectFromRSS(source);
        
      case 'INSTAGRAM':
        return await collectFromInstagram(source);
        
      case 'SPOTIFY':
        return await collectFromSpotify(source);
        
      case 'IBGE':
        return await collectFromIBGE(source);
        
      default:
        result.errors = [`Tipo de fonte não suportado: ${source.type}`];
        return result;
    }
  } catch (error) {
    result.errors = [error instanceof Error ? error.message : 'Erro desconhecido'];
    return result;
  }
}

async function collectFromRSS(source: NewsSource): Promise<CollectionResult> {
  const result: CollectionResult = {
    success: false,
    items_collected: 0,
    source_name: source.name,
    errors: []
  };

  try {
    console.log(`📰 Coletando RSS: ${source.url}`);
    
    // Usar cors-anywhere ou proxy para RSS
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`Erro RSS: ${data.message || 'Feed inválido'}`);
    }

    const items = data.items || [];
    console.log(`📋 Encontrados ${items.length} itens no RSS`);

    // Processar cada item do RSS
    const processedItems = [];
    for (const item of items.slice(0, 10)) { // Limitar a 10 por vez
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('radar_brasis')
        .select('id')
        .eq('link', item.link)
        .single();

      if (!existing) {
        const processedItem = {
          title: item.title,
          link: item.link,
          source: source.name,
          pub_date: item.pubDate || new Date().toISOString(),
          editoria: 'RSS',
          tags: ['brasil', 'rss'],
          relevancia: 3,
          status: 'A curar',
          resumo_curado: item.description || item.title,
          input_bruto: JSON.stringify(item)
        };

        processedItems.push(processedItem);
      }
    }

    // Salvar novos itens
    if (processedItems.length > 0) {
      const { error: insertError } = await supabase
        .from('radar_brasis')
        .insert(processedItems);

      if (insertError) {
        throw insertError;
      }

      result.items_collected = processedItems.length;
    }

    result.success = true;
    console.log(`✅ RSS processado: ${result.items_collected} novos itens`);
    
  } catch (error) {
    console.error('Erro ao coletar RSS:', error);
    result.errors = [error instanceof Error ? error.message : 'Erro desconhecido'];
  }

  return result;
}

async function collectFromInstagram(source: NewsSource): Promise<CollectionResult> {
  const result: CollectionResult = {
    success: false,
    items_collected: 0,
    source_name: source.name,
    errors: ['Instagram API não configurada ainda - Etapa 2']
  };
  
  return result;
}

async function collectFromSpotify(source: NewsSource): Promise<CollectionResult> {
  const result: CollectionResult = {
    success: false,
    items_collected: 0,
    source_name: source.name,
    errors: ['Spotify API não configurada ainda - Etapa 2']
  };
  
  return result;
}

async function collectFromIBGE(source: NewsSource): Promise<CollectionResult> {
  const result: CollectionResult = {
    success: false,
    items_collected: 0,
    source_name: source.name,
    errors: ['IBGE API não configurada ainda - Etapa 2']
  };
  
  return result;
}