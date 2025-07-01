
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RadarBrasisRow } from '@/types/supabase';

export interface RadarBrasisItem extends RadarBrasisRow {}

export const useRadarBrasis = () => {
  return useQuery({
    queryKey: ['radar-brasis'],
    queryFn: async (): Promise<RadarBrasisItem[]> => {
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
        return data || [];
      } catch (error) {
        console.error('Erro de conexão com Supabase:', error);
        // Em caso de erro, retorna dados de exemplo
        return [
          {
            id: 'exemplo-1',
            title: 'Conecte o Supabase para ver dados reais',
            link: 'https://supabase.com',
            source: 'Sistema',
            pub_date: new Date().toISOString(),
            editoria: 'Sistema',
            tags: ['configuração', 'supabase'],
            relevancia: 5,
            status: 'A curar',
            resumo_curado: 'Configure sua conexão com Supabase para começar a usar a curadoria real.',
            created_at: new Date().toISOString()
          }
        ];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<RadarBrasisItem> }) => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar:', error);
        throw error;
      }
      
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};

export const useCreateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<RadarBrasisItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .insert({
          ...payload,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar:', error);
        throw error;
      }
      
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};
