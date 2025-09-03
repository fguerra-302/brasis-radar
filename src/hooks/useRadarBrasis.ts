
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
      console.log('Hook useRadarBrasis - Buscando dados do Supabase (sem auth)');
      
      try {
        const { data, error } = await supabase
          .from('radar_brasis')
          .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at')
          .order('relevancia', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao buscar dados:', error);
          toast.error('Erro ao carregar conteúdo');
          throw error;
        }
        
        console.log(`Dados carregados: ${data?.length || 0} itens`);
        return data ? mapToContent(data) : [];
      } catch (error) {
        console.error('Erro de conexão com Supabase:', error);
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
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
      
      toast.success('Conteúdo atualizado com sucesso');
      return mapToContent([data])[0];
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};

// Consolidação com funcionalidades do useContentFetcher
export const useRadarBrasisWithFilters = (filters?: ContentFilters) => {
  return useQuery({
    queryKey: ['radar-brasis', filters],
    queryFn: async (): Promise<CuratedContent[]> => {
      console.log('Hook useRadarBrasis - Buscando dados com filtros:', filters);
      
      let query = supabase
        .from('radar_brasis')
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at')
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
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar conteúdo filtrado');
        throw error;
      }
      
      console.log(`Dados carregados: ${data?.length || 0} itens`);
      return data ? mapToContent(data) : [];
    },
    retry: false,
    refetchOnWindowFocus: false,
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
