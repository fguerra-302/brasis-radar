
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RadarSourceRow, RadarKeywordRow } from '@/types/supabase';

export interface NewsSource extends RadarSourceRow {}
export interface KeywordCategory extends RadarKeywordRow {}

export const useRadarSources = () => {
  return useQuery({
    queryKey: ['radar-sources'],
    queryFn: async (): Promise<NewsSource[]> => {
      const { data, error } = await supabase
        .from('radar_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar fontes:', error);
        throw error;
      }
      
      return (data || []) as NewsSource[];
    },
  });
};

export const useRadarKeywords = () => {
  return useQuery({
    queryKey: ['radar-keywords'],
    queryFn: async (): Promise<KeywordCategory[]> => {
      const { data, error } = await supabase
        .from('radar_keywords')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar palavras-chave:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};

export const useUpdateRadarSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<NewsSource> }) => {
      const { data, error } = await supabase
        .from('radar_sources')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-sources'] });
    },
  });
};

export const useCreateRadarSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<NewsSource, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('radar_sources')
        .insert({
          ...payload,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-sources'] });
    },
  });
};

export const useDeleteRadarSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('radar_sources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-sources'] });
    },
  });
};

export const useUpdateRadarKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<KeywordCategory> }) => {
      const { data, error } = await supabase
        .from('radar_keywords')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-keywords'] });
    },
  });
};
