import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { SourceGroupAssignment } from '@/types/content';

export function useSourceGroupAssignments(groupId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['source-group-assignments', user?.id, groupId],
    queryFn: async (): Promise<SourceGroupAssignment[]> => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('source_group_assignments')
        .select('*')
        .eq('user_id', user.id);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignSourceToGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sourceId, groupId }: { sourceId: string; groupId: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('source_group_assignments')
        .insert({
          user_id: user.id,
          source_id: sourceId,
          group_id: groupId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-group-assignments'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        // Silently ignore duplicates
      } else {
        toast.error('Erro ao associar fonte');
      }
    },
  });
}

export function useRemoveSourceFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, groupId }: { sourceId: string; groupId: string }) => {
      const { error } = await supabase
        .from('source_group_assignments')
        .delete()
        .eq('source_id', sourceId)
        .eq('group_id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-group-assignments'] });
    },
    onError: () => {
      toast.error('Erro ao remover fonte do grupo');
    },
  });
}

export function useBulkAssignSourcesToGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sourceIds, groupId }: { sourceIds: string[]; groupId: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // First remove all existing assignments for this group
      await supabase
        .from('source_group_assignments')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      // Then insert new assignments
      if (sourceIds.length > 0) {
        const assignments = sourceIds.map(sourceId => ({
          user_id: user.id,
          source_id: sourceId,
          group_id: groupId,
        }));

        const { error } = await supabase
          .from('source_group_assignments')
          .insert(assignments);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-group-assignments'] });
      toast.success('Fontes atualizadas');
    },
    onError: () => {
      toast.error('Erro ao atualizar fontes');
    },
  });
}
