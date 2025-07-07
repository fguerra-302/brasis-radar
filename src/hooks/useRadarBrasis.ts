import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CuratedContent, ContentStatus } from '@/types/content';

export type RadarBrasisItem = CuratedContent; // Compatibilidade com código existente

export const useRadarBrasis = () => {
  return useQuery({
    queryKey: ['radar-brasis'],
    queryFn: async (): Promise<CuratedContent[]> => {
      console.log('Hook useRadarBrasis - Buscando dados do Supabase');
      
      try {
        const { data, error } = await supabase
          .from('radar_brasis')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao buscar dados:', error);
          throw error;
        }
        
        console.log(`Dados carregados: ${data?.length || 0} itens`);
        return data ? mapToContent(data) : [];
      } catch (error) {
        console.error('Erro de conexão com Supabase:', error);
        throw error; // Propagar o erro em vez de retornar dados fake
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};

// Função helper para mapear dados do Supabase para CuratedContent
const mapToContent = (data: any[]): CuratedContent[] => {
  return data.map(item => ({
    id: item.id,
    title: item.title,
    excerpt: item.resumo_curado,
    source_url: item.link,
    source: item.source,
    pub_date: item.pub_date,
    editoria: item.editoria,
    tags: item.tags || [],
    score: item.relevancia || 1,
    status: item.status as ContentStatus,
    resumo_curado: item.resumo_curado,
    input_bruto: item.input_bruto,
    created_at: item.created_at,
    updated_at: item.updated_at,
    user_id: item.user_id
  }));
};

export const useUpdateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CuratedContent> }) => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .update({
          title: payload.title,
          editoria: payload.editoria,
          tags: payload.tags,
          relevancia: payload.score,
          status: payload.status,
          resumo_curado: payload.resumo_curado,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar:', error);
        throw error;
      }
      
      return mapToContent([data])[0];
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};

export const useCreateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<CuratedContent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .insert({
          title: payload.title,
          link: payload.source_url,
          source: payload.source,
          pub_date: payload.pub_date,
          editoria: payload.editoria,
          tags: payload.tags,
          relevancia: payload.score,
          status: payload.status,
          resumo_curado: payload.resumo_curado,
          input_bruto: payload.input_bruto,
          user_id: payload.user_id
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar:', error);
        throw error;
      }
      
      return mapToContent([data])[0];
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};