import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserSettings {
  id: string;
  user_id: string;
  company_name: string;
  company_description: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  newsletter_signature: string;
  newsletter_footer: string;
  ai_newsletter_prompt: string | null;
  ai_example_audiences: string[] | null;
  min_relevance_threshold: number;
  created_at: string;
  updated_at: string;
}

export type UserSettingsUpdate = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const useUserSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async (): Promise<UserSettings | null> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar configurações:', error);
        toast.error('Erro ao carregar configurações');
        throw error;
      }
      
      return data as UserSettings;
    },
    enabled: !!user?.id,
  });
};

export const useCreateUserSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (payload: UserSettingsUpdate) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...payload
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar configurações:', error);
        toast.error('Erro ao criar configurações');
        throw error;
      }
      
      toast.success('Configurações criadas com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      payload 
    }: { 
      id: string; 
      payload: UserSettingsUpdate;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Garantir que só atualiza próprios dados
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar configurações:', error);
        toast.error('Erro ao atualizar configurações');
        throw error;
      }
      
      toast.success('Configurações atualizadas com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
};

export const useUpsertUserSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (payload: UserSettingsUpdate) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...payload
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar configurações:', error);
        // Evitar spam de toast para erros de duplicidade
        if (!error.message?.includes('23505')) {
          toast.error('Erro ao salvar configurações');
        }
        throw error;
      }
      
      toast.success('Configurações salvas com sucesso');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
};