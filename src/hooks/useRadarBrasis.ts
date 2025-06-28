
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RadarBrasisRow } from '@/types/supabase';

export interface RadarBrasisItem extends RadarBrasisRow {}

export const useRadarBrasis = () => {
  return useQuery({
    queryKey: ['radar-brasis'],
    queryFn: async (): Promise<RadarBrasisItem[]> => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
      }
      
      return data || [];
    },
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
