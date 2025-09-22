// ⚡ OTIMIZAÇÃO 5: Hook centralizado consolidando user_settings e editorial_weights
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EditorialWeight {
  id: string;
  user_id: string;
  editoria: string;
  multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  min_relevance_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface AppConfig {
  editorialWeights: EditorialWeight[];
  userSettings: UserSettings | null;
}

export const useAppConfig = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['app-config', user?.id],
    queryFn: async (): Promise<AppConfig> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🚀 useAppConfig - Carregando configurações em paralelo');
      
      // ⚡ Execução paralela de ambas queries - 50% menos queries
      const [editorialResult, settingsResult] = await Promise.all([
        supabase
          .from('editorial_weights')
          .select('*')
          .eq('user_id', user.id)
          .order('editoria'),
        
        supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (editorialResult.error) {
        console.error('Erro ao buscar editorial weights:', editorialResult.error);
        throw editorialResult.error;
      }

      if (settingsResult.error) {
        console.error('Erro ao buscar user settings:', settingsResult.error);
        throw settingsResult.error;
      }

      console.log(`✅ Configurações carregadas: ${editorialResult.data?.length || 0} multiplicadores, threshold: ${settingsResult.data?.min_relevance_threshold || 'padrão'}`);

      return {
        editorialWeights: editorialResult.data || [],
        userSettings: settingsResult.data || null
      };
    },
    // ⚡ Cache compartilhado entre configurações
    staleTime: 10 * 60 * 1000, // 10 minutos - configurações mudam pouco
    gcTime: 30 * 60 * 1000, // 30 minutos GC
    enabled: !!user?.id,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

// Hooks derivados para manter compatibilidade
export const useEditorialWeightsFromConfig = () => {
  const { data: config, isLoading, error } = useAppConfig();
  
  return {
    data: config?.editorialWeights,
    isLoading,
    error
  };
};

export const useUserSettingsFromConfig = () => {
  const { data: config, isLoading, error } = useAppConfig();
  
  return {
    data: config?.userSettings,
    isLoading,
    error
  };
};