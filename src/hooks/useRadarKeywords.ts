import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useRadarKeywords = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['radar-keywords', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

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
    enabled: !!user?.id,
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