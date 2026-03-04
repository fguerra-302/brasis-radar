import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectSourceLink {
  id: string;
  folder_id: string;
  source_id: string;
  user_id: string;
  created_at: string;
}

export const useProjectSourceLinks = (folderId?: string) => {
  return useQuery({
    queryKey: ['project-source-links', folderId],
    queryFn: async () => {
      let query = supabase.from('project_source_links').select('*');
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }
      const { data, error } = await query;

      if (error) {
        toast.error('Erro ao carregar links de fontes');
        throw error;
      }
      return (data || []) as ProjectSourceLink[];
    },
    enabled: !!folderId,
    refetchOnWindowFocus: false,
  });
};

export const useAddSourceToFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ folderId, sourceId }: { folderId: string; sourceId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth required');

      const { data, error } = await supabase
        .from('project_source_links')
        .insert({
          folder_id: folderId,
          source_id: sourceId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectSourceLink;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['project-source-links', vars.folderId] });
      toast.success('Fonte adicionada à pasta');
    },
    onError: (err: any) => {
      if (err?.message?.includes('duplicate key')) {
        toast.error('Esta fonte já está nesta pasta');
      } else {
        toast.error('Erro ao adicionar fonte à pasta');
      }
    },
  });
};

export const useRemoveSourceFromFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ folderId, sourceId }: { folderId: string; sourceId: string }) => {
      const { error } = await supabase
        .from('project_source_links')
        .delete()
        .eq('folder_id', folderId)
        .eq('source_id', sourceId);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['project-source-links', vars.folderId] });
      toast.success('Fonte removida da pasta');
    },
    onError: () => toast.error('Erro ao remover fonte da pasta'),
  });
};
