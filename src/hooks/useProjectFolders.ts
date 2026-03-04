import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectFolder {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjectFolders = () => {
  return useQuery({
    queryKey: ['project-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar pastas de projeto');
        throw error;
      }
      return (data || []) as ProjectFolder[];
    },
    refetchOnWindowFocus: false,
  });
};

export const useCreateProjectFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth required');

      const { data, error } = await supabase
        .from('project_folders')
        .insert({
          name: payload.name,
          description: payload.description || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-folders'] });
      toast.success('Pasta criada');
    },
    onError: () => toast.error('Erro ao criar pasta'),
  });
};

export const useUpdateProjectFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Pick<ProjectFolder, 'name' | 'description'>> }) => {
      const { data, error } = await supabase
        .from('project_folders')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-folders'] });
      toast.success('Pasta atualizada');
    },
    onError: () => toast.error('Erro ao atualizar pasta'),
  });
};

export const useDeleteProjectFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-folders'] });
      toast.success('Pasta removida');
    },
    onError: () => toast.error('Erro ao remover pasta'),
  });
};
