import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EditorialWeight {
  id: string;
  user_id: string;
  editoria: string;
  multiplier: number;
  created_at: string;
  updated_at: string;
}

export const useEditorialWeights = () => {
  return useQuery({
    queryKey: ['editorial-weights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editorial_weights')
        .select('*')
        .order('editoria', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar pesos editoriais:', error);
        toast.error('Erro ao carregar pesos editoriais');
        throw error;
      }
      
      return data || [];
    },
  });
};

export const useCreateEditorialWeight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      editoria, 
      multiplier = 1.0 
    }: { 
      editoria: string; 
      multiplier?: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('editorial_weights')
        .insert({
          user_id: user.user.id,
          editoria,
          multiplier,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar peso editorial:', error);
        toast.error('Erro ao criar peso editorial');
        throw error;
      }
      
      toast.success('Peso editorial criado com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-weights'] });
    },
  });
};

export const useUpdateEditorialWeight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      payload 
    }: { 
      id: string; 
      payload: Partial<{
        editoria: string;
        multiplier: number;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('editorial_weights')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar peso editorial:', error);
        toast.error('Erro ao atualizar peso editorial');
        throw error;
      }
      
      toast.success('Peso editorial atualizado com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-weights'] });
    },
  });
};

export const useDeleteEditorialWeight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('editorial_weights')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar peso editorial:', error);
        toast.error('Erro ao deletar peso editorial');
        throw error;
      }
      
      toast.success('Peso editorial deletado com sucesso');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-weights'] });
    },
  });
};

export const useUpsertEditorialWeight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      editoria, 
      multiplier 
    }: { 
      editoria: string; 
      multiplier: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('editorial_weights')
        .upsert({
          user_id: user.user.id,
          editoria,
          multiplier,
        }, {
          onConflict: 'user_id,editoria'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar peso editorial:', error);
        toast.error('Erro ao salvar peso editorial');
        throw error;
      }
      
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-weights'] });
    },
  });
};