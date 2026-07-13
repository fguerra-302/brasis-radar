import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useFluxoValidation = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fluxo-validation', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('status')
        .eq('user_id', user!.id);

      if (error) throw error;

      const statusCount: Record<string, number> = (data || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const totalItems = Object.values(statusCount).reduce((a, b) => a + b, 0);
      const warnings: string[] = [];
      if (totalItems === 0) warnings.push('⚠️ Nenhum item encontrado - execute uma coleta primeiro');
      if (!statusCount['Em aprovação']) warnings.push('⚠️ Não há itens para processar na curadoria');
      if (statusCount['Publicado'] > 0) warnings.push(`⚠️ ${statusCount['Publicado']} itens com status antigo "Publicado"`);

      return { totalItems, statusDistribution: statusCount, warnings };
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
