
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRadarKeywords = () => {
  return useQuery({
    queryKey: ['radar-keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_keywords')
        .select('id, category_name, keywords, weight, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar keywords:', error);
        toast.error('Erro ao carregar palavras-chave');
        throw error;
      }
      
      return data || [];
    },
  });
};

export const useUpdateRadarKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      payload 
    }: { 
      id: string; 
      payload: Partial<{
        category_name: string;
        keywords: string[];
        weight: number;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('radar_keywords')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, category_name, keywords, weight, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('Erro ao atualizar palavra-chave:', error);
        toast.error('Erro ao atualizar palavra-chave');
        throw error;
      }
      
      toast.success('Palavra-chave atualizada com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-keywords'] });
    },
  });
};

export const useCreateRadarKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      category_name, 
      weight = 1, 
      keywords = [] 
    }: { 
      category_name: string; 
      weight?: number; 
      keywords?: string[];
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('radar_keywords')
        .insert({
          user_id: user.user.id,
          category_name,
          weight,
          keywords,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, category_name, keywords, weight, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('Erro ao criar categoria:', error);
        toast.error('Erro ao criar categoria');
        throw error;
      }
      
      toast.success('Categoria criada com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-keywords'] });
    },
  });
};

export const useRenameRadarKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, category_name }: { id: string; category_name: string }) => {
      const { data, error } = await supabase
        .from('radar_keywords')
        .update({
          category_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, category_name, keywords, weight, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('Erro ao renomear categoria:', error);
        toast.error('Erro ao renomear categoria');
        throw error;
      }
      
      toast.success('Categoria renomeada com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-keywords'] });
    },
  });
};

export const useDeleteRadarKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('radar_keywords')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar categoria:', error);
        toast.error('Erro ao deletar categoria');
        throw error;
      }
      
      toast.success('Categoria deletada com sucesso');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-keywords'] });
    },
  });
};
