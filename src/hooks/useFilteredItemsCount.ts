import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFilteredItemsCount = (threshold: number) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['filtered-items-count', user?.id, threshold],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;
      
      const today = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
      
      // Count items created today that would be filtered out by threshold
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', today)
        .lt('relevancia', threshold);
      
      if (error) {
        console.error('Error fetching filtered count:', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });
};