
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_RSS_SOURCES } from '@/utils/defaultRSSSources';
import { useAuth } from './useAuth';

export const useInitializeDefaultSources = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeDefaultSources = async () => {
      if (!user) return;

      try {
        console.log('🔄 Inicializando fontes padrão para usuário:', user.id);

        // Verificar se já existem fontes para este usuário
        const { data: existingSources, error: checkError } = await supabase
          .from('radar_sources')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (checkError) {
          console.error('❌ Erro ao verificar fontes existentes:', checkError);
          return;
        }

        // Se já tem fontes, não inicializar novamente
        if (existingSources && existingSources.length > 0) {
          console.log('✅ Usuário já possui fontes configuradas');
          return;
        }

        console.log('📝 Inserindo fontes padrão...');

        // Inserir fontes padrão usando upsert para evitar duplicatas
        const sourcesToInsert = DEFAULT_RSS_SOURCES.map(source => ({
          user_id: user.id,
          name: source.name,
          url: source.url,
          type: source.type,
          active: true
        }));

        // Usar upsert com a nova constraint (user_id, url, type)
        const { data, error } = await supabase
          .from('radar_sources')
          .upsert(sourcesToInsert, {
            onConflict: 'user_id,url,type',
            ignoreDuplicates: true
          })
          .select('id, name');

        if (error) {
          console.error('❌ Erro ao inserir fontes padrão:', error);
          return;
        }

        console.log(`✅ ${data?.length || 0} fontes padrão inicializadas para ${user.email}`);
      } catch (error) {
        console.error('❌ Erro na inicialização das fontes padrão:', error);
      }
    };

    initializeDefaultSources();
  }, [user]);
};
