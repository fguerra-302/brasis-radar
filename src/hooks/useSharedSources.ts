import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SharedSource {
  id: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

export const useSharedSources = () => {
  return useQuery({
    queryKey: ['shared-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_sources')
        .select('id, name, url, type, active, config, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) {
        toast.error('Erro ao carregar catálogo de fontes');
        throw error;
      }
      return (data || []) as SharedSource[];
    },
    refetchOnWindowFocus: false,
  });
};

export const useCreateSharedSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; url: string; type: string; active?: boolean; config?: any }) => {
      const { data, error } = await supabase
        .from('shared_sources')
        .insert({
          name: payload.name,
          url: payload.url,
          type: payload.type,
          active: payload.active ?? true,
          config: payload.config,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SharedSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-sources'] });
      toast.success('Fonte adicionada ao catálogo');
    },
    onError: (err: any) => {
      if (err?.message?.includes('duplicate key')) {
        toast.error('Esta fonte (URL + tipo) já existe no catálogo');
      } else {
        toast.error('Erro ao adicionar fonte');
      }
    },
  });
};

export const useUpdateSharedSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<SharedSource> }) => {
      const { data, error } = await supabase
        .from('shared_sources')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SharedSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-sources'] });
      toast.success('Fonte atualizada');
    },
    onError: () => toast.error('Erro ao atualizar fonte'),
  });
};

export const useDeleteSharedSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-sources'] });
      toast.success('Fonte removida do catálogo');
    },
    onError: () => toast.error('Erro ao remover fonte'),
  });
};
