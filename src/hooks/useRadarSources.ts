import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useRadarSources = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['radar-sources', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('radar_sources')
        .select('id, name, url, type, active, credentials, config, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar fontes:', error);
        toast.error('Erro ao carregar fontes de dados');
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useCreateRadarSource = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      url: string;
      type: 'RSS' | 'INSTAGRAM' | 'SPOTIFY' | 'IBGE' | 'NEWSLETTER';
      active: boolean;
      credentials?: Record<string, any>;
      config?: Record<string, any>;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error } = await supabase
        .from('radar_sources')
        .insert({
          name: payload.name,
          url: payload.url,
          type: payload.type,
          active: payload.active,
          user_id: user.id,
          credentials: payload.credentials,
          config: payload.config
        })
        .select('id, name, url, type, active, credentials, config, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('Erro ao criar fonte:', error);
        toast.error('Erro ao criar fonte de dados');
        throw error;
      }
      
      toast.success('Fonte criada com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-sources'] });
    },
  });
};

export const useUpdateRadarSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      payload 
    }: { 
      id: string; 
      payload: Partial<{
        name: string;
        url: string;
        type: 'RSS' | 'INSTAGRAM' | 'SPOTIFY' | 'IBGE' | 'NEWSLETTER';
        active: boolean;
        credentials: Record<string, any>;
        config: Record<string, any>;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('radar_sources')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, name, url, type, active, credentials, config, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('Erro ao atualizar fonte:', error);
        toast.error('Erro ao atualizar fonte de dados');
        throw error;
      }
      
      toast.success('Fonte atualizada com sucesso');
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
      
      if (error) {
        console.error('Erro ao excluir fonte:', error);
        toast.error('Erro ao excluir fonte de dados');
        throw error;
      }
      
      toast.success('Fonte excluída com sucesso');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-sources'] });
    },
  });
};