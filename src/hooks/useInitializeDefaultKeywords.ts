import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_KEYWORD_CATEGORIES } from '@/utils/defaultKeywordCategories';

export const useInitializeDefaultKeywords = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const initializeDefaultKeywords = async () => {
      if (!user?.id) {
        setIsInitialized(false);
        return;
      }

      try {
        console.log('🔄 Inicializando keywords padrão para usuário:', user.id);

        const { data: existingKeywords, error: checkError } = await supabase
          .from('radar_keywords')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (checkError) {
          console.error('❌ Erro ao verificar keywords existentes:', checkError);
          setIsInitialized(false);
          return;
        }

        if (existingKeywords && existingKeywords.length > 0) {
          console.log('✅ Usuário já possui keywords configuradas');
          setIsInitialized(true);
          return;
        }

        console.log('📝 Inserindo keywords padrão...');

        const categoriesForUser = DEFAULT_KEYWORD_CATEGORIES.map(category => ({
          ...category,
          user_id: user.id
        }));

        const { error: insertError } = await supabase
          .from('radar_keywords')
          .insert(categoriesForUser);

        if (insertError) {
          console.error('❌ Erro ao inserir keywords padrão:', insertError);
          setIsInitialized(false);
          return;
        }

        console.log(`✅ ${DEFAULT_KEYWORD_CATEGORIES.length} keywords padrão inicializadas para ${user.email}`);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Erro na inicialização das keywords padrão:', error);
        setIsInitialized(false);
      }
    };

    initializeDefaultKeywords();
  }, [user]);

  const initializeDefaultKeywords = async () => {
    // Manual trigger - just refetch
    setIsInitializing(true);
    try {
      const { data } = await supabase
        .from('radar_keywords')
        .select('id')
        .eq('user_id', user?.id || '')
        .limit(1);
      if (!data || data.length === 0) {
        const categoriesForUser = DEFAULT_KEYWORD_CATEGORIES.map(category => ({
          ...category,
          user_id: user!.id
        }));
        await supabase.from('radar_keywords').insert(categoriesForUser);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  return { isInitialized, isInitializing, initializeDefaultKeywords };
};