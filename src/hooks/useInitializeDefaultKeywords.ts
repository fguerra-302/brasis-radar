import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEFAULT_KEYWORD_CATEGORIES } from '@/utils/defaultKeywordCategories';

export const useInitializeDefaultKeywords = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && !isInitialized) {
      setIsInitialized(true);
    }
  }, [user?.id, isInitialized]);

  const initializeDefaultKeywords = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsInitializing(true);

    try {
      // Verificar se já existem categorias
      const { data: existingKeywords, error: fetchError } = await supabase
        .from('radar_keywords')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (fetchError) {
        console.error('Erro ao verificar palavras-chave existentes:', fetchError);
        throw fetchError;
      }

      if (existingKeywords && existingKeywords.length > 0) {
        toast.info('Categorias já existem para este usuário');
        return;
      }

      // Inserir categorias padrão
      const categoriesForUser = DEFAULT_KEYWORD_CATEGORIES.map(category => ({
        ...category,
        user_id: user.id
      }));

      const { error: insertError } = await supabase
        .from('radar_keywords')
        .insert(categoriesForUser);

      if (insertError) {
        console.error('Erro ao inserir categorias padrão:', insertError);
        throw insertError;
      }

      toast.success(`${DEFAULT_KEYWORD_CATEGORIES.length} categorias padrão criadas com sucesso!`);
      
      // Recarregar a página para atualizar os dados
      window.location.reload();

    } catch (error) {
      console.error('Erro ao inicializar categorias padrão:', error);
      toast.error('Erro ao criar categorias padrão: ' + ((error as Error).message || 'Erro desconhecido'));
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    isInitialized,
    isInitializing,
    initializeDefaultKeywords
  };
};