
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_RSS_SOURCES } from '@/utils/defaultRSSSources';
import { toast } from 'sonner';

export const useInitializeDefaultSources = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    initializeDefaultSources();
  }, []);

  const initializeDefaultSources = async () => {
    try {
      setIsInitializing(true);
      
      // Garantir que há usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado - pulando inicialização de fontes padrão');
        return;
      }
      
      // Verificar se já existem fontes do usuário
      const { data: existingSources, error: checkError } = await supabase
        .from('radar_sources')
        .select('name')
        .limit(5);

      if (checkError) {
        console.error('Erro ao verificar fontes existentes:', checkError);
        return;
      }

      // Se já tem fontes, não precisa inicializar
      if (existingSources && existingSources.length > 0) {
        console.log('✅ Fontes já existem, pulando inicialização');
        setIsInitialized(true);
        return;
      }

      console.log('🚀 Inicializando fontes RSS padrão...');

      // Inserir fontes padrão
      const sourcesToInsert = DEFAULT_RSS_SOURCES.map(source => ({
        name: source.name,
        url: source.url,
        type: source.type,
        active: true,
        user_id: user.id
      }));

      const { data, error } = await supabase
        .from('radar_sources')
        .insert(sourcesToInsert)
        .select('name');

      if (error) {
        console.error('❌ Erro ao inserir fontes:', error);
        toast.error('Erro ao configurar fontes RSS');
        return;
      }

      console.log(`✅ ${data?.length || 0} fontes RSS configuradas com sucesso!`);
      toast.success(`${data?.length || 0} fontes RSS configuradas automaticamente`);
      setIsInitialized(true);

    } catch (error) {
      console.error('❌ Erro na inicialização das fontes:', error);
    } finally {
      setIsInitializing(false);
    }
  };

      console.log(`✅ ${data?.length || 0} fontes RSS configuradas com sucesso!`);
      toast.success(`${data?.length || 0} fontes RSS configuradas automaticamente`);
      setIsInitialized(true);

    } catch (error) {
      console.error('❌ Erro na inicialização das fontes:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  return { isInitialized, isInitializing, initializeDefaultSources };
};
