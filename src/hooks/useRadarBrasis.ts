import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CuratedContent, ContentStatus, ContentFilters } from '@/types/content';

export type RadarBrasisItem = CuratedContent;

export const useRadarBrasis = () => {
  return useQuery({
    queryKey: ['radar-brasis'],
    queryFn: async (): Promise<CuratedContent[]> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from('radar_brasis')
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at, user_id, group_id')
        .eq('user_id', session.user.id)
        .order('relevancia', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('row-level security')) {
          await supabase.auth.refreshSession();
          toast.error('Erro de autenticação - faça login novamente');
        } else {
          toast.error('Erro ao carregar conteúdo');
        }
        throw error;
      }

      return data ? mapToContent(data) : [];
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST301' || error?.message?.includes('row-level security')) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
  });
};

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
          title: payload.title, editoria: payload.editoria, tags: payload.tags,
          relevancia: payload.score, status: payload.status,
          resumo_curado: payload.resumo_curado, updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at')
        .single();

      if (error) { toast.error('Erro ao atualizar conteúdo'); throw error; }

      const updatedItem = mapToContent([data])[0];
      queryClient.setQueryData(['radar-brasis'], (oldData: CuratedContent[] | undefined) => {
        if (!oldData) return [updatedItem];
        return oldData.map(item => item.id === id ? updatedItem : item);
      });
      toast.success('Conteúdo atualizado');
      return updatedItem;
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};

export const useRadarBrasisWithFilters = (filters?: ContentFilters) => {
  return useQuery({
    queryKey: ['radar-brasis', filters],
    queryFn: async (): Promise<CuratedContent[]> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) return [];

      let query = supabase
        .from('radar_brasis')
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at, user_id')
        .eq('user_id', session.user.id)
        .order('relevancia', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.editoria) query = query.eq('editoria', filters.editoria);
      if (filters?.searchTerm) query = query.or(`title.ilike.%${filters.searchTerm}%,source.ilike.%${filters.searchTerm}%`);

      const { data, error } = await query;
      if (error) { toast.error('Erro ao carregar conteúdo filtrado'); throw error; }
      return data ? mapToContent(data) : [];
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST301' || error?.message?.includes('row-level security')) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
  });
};

export const useRadarBrasisStats = () => {
  const { data: items, isLoading } = useRadarBrasis();

  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return { total: 0, imported: 0, reviewing: 0, approved: 0, rejected: 0, hoje: 0, ultimaHora: 0 };
    }
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);

    return {
      total: items.length,
      imported: items.filter(i => i.status === ContentStatus.COLLECTED || i.status === ContentStatus.REVIEWING).length,
      reviewing: items.filter(i => i.status === ContentStatus.REVIEWING).length,
      approved: items.filter(i => i.status === ContentStatus.FOR_NEWSLETTER).length,
      rejected: items.filter(i => i.status === ContentStatus.REJECTED).length,
      hoje: items.filter(i => new Date(i.created_at) >= hoje).length,
      ultimaHora: items.filter(i => new Date(i.created_at) >= umaHoraAtras).length,
    };
  }, [items]);

  return { stats, isLoading };
};

export const useCreateRadarBrasis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<CuratedContent, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase
        .from('radar_brasis')
        .insert({
          title: payload.title, link: payload.source_url, source: payload.source,
          pub_date: payload.pub_date, editoria: payload.editoria, tags: payload.tags,
          relevancia: payload.score, status: payload.status,
          resumo_curado: payload.resumo_curado, input_bruto: payload.input_bruto,
          user_id: user.id
        })
        .select('id, title, link, source, pub_date, editoria, tags, relevancia, status, resumo_curado, input_bruto, created_at, updated_at')
        .single();

      if (error) { toast.error('Erro ao criar conteúdo'); throw error; }
      toast.success('Conteúdo criado');
      return mapToContent([data])[0];
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};
