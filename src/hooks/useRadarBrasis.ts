
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CuratedContent, ContentStatus, ContentFilters, ContentStats } from '@/types/content';

export type RadarBrasisItem = CuratedContent; // Compatibilidade com código existente

export const useRadarBrasis = () => {
  return useQuery({
    queryKey: ['radar-brasis'],
    queryFn: async (): Promise<CuratedContent[]> => {
      console.log('🔍 useRadarBrasis - Verificando autenticação...');
      
      // Verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro ao verificar sessão:', sessionError);
        throw sessionError;
      }
      
      if (!session?.user) {
        console.warn('⚠️ Usuário não autenticado - carregando dados demo');
        return [];
      }
      
      console.log('✅ Usuário autenticado:', session.user.id);
      
      try {
        const { data, error } = await supabase
          .from('radar_brasis')
          .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at, user_id')
          .eq('user_id', session.user.id) // CRÍTICO: Filtrar pelos dados do usuário
          .order('relevancia', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error('❌ Erro RLS ao buscar dados:', error);
          // Se for erro de RLS, tentar reautenticar
          if (error.code === 'PGRST301' || error.message.includes('row-level security')) {
            console.log('🔄 Tentando refresh da sessão...');
            await supabase.auth.refreshSession();
            toast.error('Erro de autenticação - faça login novamente');
          } else {
            toast.error('Erro ao carregar conteúdo');
          }
          throw error;
        }
        
        console.log(`✅ Dados carregados: ${data?.length || 0} itens reais para usuário ${session.user.id}`);
        if (data && data.length > 0) {
          console.log('📄 Primeiro item:', data[0].title);
        } else {
          console.log('ℹ️ Nenhum item encontrado - execute uma coleta primeiro');
        }
        
        return data ? mapToContent(data) : [];
      } catch (error) {
        console.error('❌ Erro de conexão com Supabase:', error);
        throw error;
      }
    },
    enabled: true, // Sempre habilitado, mas com verificação interna de auth
    staleTime: 2 * 60 * 1000, // 2 minutos - mais agressivo para dados reais
    gcTime: 5 * 60 * 1000, // 5 minutos - garbage collection
    retry: (failureCount, error: any) => {
      // Retry se for erro de rede, mas não se for erro de auth
      if (error?.code === 'PGRST301' || error?.message?.includes('row-level security')) {
        return false; // Não retry em erros de RLS
      }
      return failureCount < 2; // Máximo 2 tentativas para outros erros
    },
    refetchOnWindowFocus: true, // Recarregar quando foco volta à janela
  });
};

// Função helper para mapear dados do Supabase para CuratedContent
const mapToContent = (data: any[]): CuratedContent[] => {
  return data.map(item => ({
    id: item.id,
    title: item.title,
    excerpt: item.resumo_curado,
    source_url: item.link,
    source: item.source,
    pub_date: item.pub_date,
    editoria: item.editoria,
    tags: item.tags || [],
    score: item.relevancia || 1,
    status: item.status as ContentStatus,
    resumo_curado: item.resumo_curado,
    input_bruto: item.input_bruto,
    created_at: item.created_at,
    updated_at: item.updated_at,
    user_id: item.user_id
  }));
};

export const useUpdateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CuratedContent> }) => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .update({
          title: payload.title,
          editoria: payload.editoria,
          tags: payload.tags,
          relevancia: payload.score,
          status: payload.status,
          resumo_curado: payload.resumo_curado,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('Erro ao atualizar:', error);
        toast.error('Erro ao atualizar conteúdo');
        throw error;
      }
      
      const updatedItem = mapToContent([data])[0];
      
      // ⚡ OTIMIZAÇÃO 4: Optimistic UI - atualização instantânea sem lag
      queryClient.setQueryData(['radar-brasis'], (oldData: CuratedContent[] | undefined) => {
        if (!oldData) return [updatedItem];
        return oldData.map(item => item.id === id ? updatedItem : item);
      });
      
      toast.success('Conteúdo atualizado com sucesso');
      return updatedItem;
    },
    onError: () => {
      // Rollback em caso de erro
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};

// Consolidação com funcionalidades do useContentFetcher
export const useRadarBrasisWithFilters = (filters?: ContentFilters) => {
  return useQuery({
    queryKey: ['radar-brasis', filters],
    queryFn: async (): Promise<CuratedContent[]> => {
      console.log('🔍 useRadarBrasisWithFilters - Verificando autenticação...');
      
      // Verificar autenticação
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro ao verificar sessão:', sessionError);
        throw sessionError;
      }
      
      if (!session?.user) {
        console.warn('⚠️ Usuário não autenticado - retornando dados vazios');
        return [];
      }
      
      console.log('✅ Buscando dados com filtros para usuário:', session.user.id, filters);
      
      let query = supabase
        .from('radar_brasis')
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at, user_id')
        .eq('user_id', session.user.id) // CRÍTICO: Filtrar pelos dados do usuário
        .order('relevancia', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.editoria) {
        query = query.eq('editoria', filters.editoria);
      }

      if (filters?.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,source.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erro ao buscar dados filtrados:', error);
        toast.error('Erro ao carregar conteúdo filtrado');
        throw error;
      }
      
      console.log(`✅ Dados filtrados carregados: ${data?.length || 0} itens`);
      return data ? mapToContent(data) : [];
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos para dados reais
    gcTime: 5 * 60 * 1000, // 5 minutos GC
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST301' || error?.message?.includes('row-level security')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
  });
};

export const useRadarBrasisStats = () => {
  const { data: items, isLoading } = useRadarBrasis();
  
  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        total: 0,
        imported: 0,
        reviewing: 0,
        approved: 0,
        rejected: 0,
        hoje: 0,
        ultimaHora: 0
      };
    }

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);

    return {
      total: items.length,
      imported: items.filter(item => 
        item.status === ContentStatus.COLLECTED || item.status === ContentStatus.REVIEWING
      ).length,
      reviewing: items.filter(item => item.status === ContentStatus.REVIEWING).length,
      approved: items.filter(item => 
        item.status === ContentStatus.FOR_NEWSLETTER || 
        item.status === ContentStatus.FOR_SOCIAL ||
        item.status === ContentStatus.FOR_BOTH
      ).length,
      rejected: items.filter(item => item.status === ContentStatus.REJECTED).length,
      hoje: items.filter(item => new Date(item.created_at) >= hoje).length,
      ultimaHora: items.filter(item => new Date(item.created_at) >= umaHoraAtras).length
    };
  }, [items]);

  return { stats, isLoading };
};

export const useCreateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<CuratedContent, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('radar_brasis')
        .insert({
          title: payload.title,
          link: payload.source_url,
          source: payload.source,
          pub_date: payload.pub_date,
          editoria: payload.editoria,
          tags: payload.tags,
          relevancia: payload.score,
          status: payload.status,
          resumo_curado: payload.resumo_curado,
          input_bruto: payload.input_bruto,
          user_id: user.id
        })
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('Erro ao criar:', error);
        toast.error('Erro ao criar conteúdo');
        throw error;
      }
      
      toast.success('Conteúdo criado com sucesso');
      return mapToContent([data])[0];
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};
