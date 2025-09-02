import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSourceCredentials = (sourceId: string) => {
  return useQuery({
    queryKey: ['source-credentials', sourceId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('source_has_credentials', {
        source_id: sourceId
      });

      if (error) {
        console.error('Erro ao verificar credenciais:', error);
        throw error;
      }

      return data;
    },
    enabled: !!sourceId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateSourceCredentials = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sourceId, 
      credentials 
    }: { 
      sourceId: string; 
      credentials: Record<string, any>;
    }) => {
      const { error } = await supabase.rpc('update_source_credentials', {
        source_id: sourceId,
        new_credentials: credentials
      });
      
      if (error) {
        console.error('Erro ao atualizar credenciais:', error);
        toast.error('Erro ao atualizar credenciais');
        throw error;
      }
      
      toast.success('Credenciais atualizadas com sucesso');
    },
    onSettled: (_, __, variables) => {
      // Invalida as queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: ['source-credentials', variables.sourceId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['radar-sources'] 
      });
    },
  });
};