import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRadarSources = () => {
  return useQuery({
    queryKey: ['radar-sources'],
    queryFn: async () => {
      console.log('📡 Buscando fontes RSS...');
      
      const { data, error } = await supabase
        .from('radar_sources')
        .select('id, name, url, type, active, credentials, config, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar fontes:', error);
        toast.error('Erro ao carregar fontes de dados');
        throw error;
      }
      
      console.log(`📊 ${data?.length || 0} fontes carregadas`);
      return data || [];
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useCreateRadarSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      url: string;
      type: 'RSS' | 'INSTAGRAM' | 'SPOTIFY' | 'IBGE' | 'NEWSLETTER';
      active: boolean;
      credentials?: Record<string, any>;
      config?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
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
        console.error('❌ Erro ao criar fonte:', error);
        const msg = (error as any)?.message || (error as any)?.error_description || 'Erro ao criar fonte de dados';
        toast.error(msg);
        throw error;
      }
      
      toast.success('✅ Fonte criada com sucesso');
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
