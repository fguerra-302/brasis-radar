import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { secureApi } from '@/lib/api';
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
      console.log('🚀 Iniciando coleta de dados via edge function...');
      
      const data = await secureApi.invokeFunction('multi-source-collector');
      
      console.log('✅ Coleta concluída:', data);
      return data;
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