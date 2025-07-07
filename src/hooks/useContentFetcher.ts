import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContentService } from '@/supabase/contentService';
import { CuratedContent, ContentStatus, ContentFilters, ContentStats } from '@/types/content';

export const useContentFetcher = (filters?: ContentFilters) => {
  return useQuery({
    queryKey: ['content', filters],
    queryFn: () => ContentService.getAllContent(filters),
    staleTime: 30000, // 30 segundos
    retry: 2,
  });
};

export const useContentById = (id: string) => {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => ContentService.getContentById(id),
    enabled: !!id,
  });
};

export const useContentStats = () => {
  return useQuery({
    queryKey: ['content-stats'],
    queryFn: async (): Promise<ContentStats> => {
      const allContent = await ContentService.getAllContent();
      
      return {
        total: allContent.length,
        imported: allContent.filter(c => c.status === ContentStatus.IMPORTED).length,
        reviewing: allContent.filter(c => c.status === ContentStatus.REVIEWING).length,
        approved: allContent.filter(c => c.status === ContentStatus.APPROVED).length,
        rejected: allContent.filter(c => c.status === ContentStatus.REJECTED).length,
      };
    },
    staleTime: 60000, // 1 minuto
  });
};

export const useUpdateContentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) =>
      ContentService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['content-stats'] });
    },
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CuratedContent> }) =>
      ContentService.updateContent(id, updates),
    onSuccess: (updatedContent) => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['content-stats'] });
      queryClient.setQueryData(['content', updatedContent.id], updatedContent);
    },
  });
};

export const useSaveContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (content: Omit<CuratedContent, 'id' | 'created_at'>) =>
      ContentService.saveContent(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['content-stats'] });
    },
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => ContentService.deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['content-stats'] });
    },
  });
};