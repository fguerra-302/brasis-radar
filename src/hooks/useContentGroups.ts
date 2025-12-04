import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { ContentGroup } from '@/types/content';

export function useContentGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['content-groups', user?.id],
    queryFn: async (): Promise<ContentGroup[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('content_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateContentGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (group: { name: string; description?: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('content_groups')
        .insert({
          user_id: user.id,
          name: group.name,
          description: group.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-groups'] });
      toast.success('Grupo criado com sucesso');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Já existe um grupo com esse nome');
      } else {
        toast.error('Erro ao criar grupo');
      }
    },
  });
}

export function useUpdateContentGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('content_groups')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-groups'] });
      toast.success('Grupo atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar grupo');
    },
  });
}

export function useDeleteContentGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-groups'] });
      toast.success('Grupo excluído');
    },
    onError: () => {
      toast.error('Erro ao excluír grupo');
    },
  });
}
