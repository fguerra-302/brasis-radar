import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFluxoValidation = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['fluxo-validation'],
    queryFn: async () => {
      console.log('🔍 Validando fluxo de curadoria...');
      
      // Verificar status disponíveis
      const { data: statusCount, error } = await supabase
        .from('radar_brasis')
        .select('status')
        .then(result => {
          if (result.error) throw result.error;
          
          const counts = result.data.reduce((acc: any, item: any) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {});
          
          return { data: counts, error: null };
        });

      if (error) throw error;

      const validation = {
        totalItems: Object.values(statusCount).reduce((a: any, b: any) => a + b, 0),
        statusDistribution: statusCount,
        warnings: [] as string[]
      };

      // Validações
      if (validation.totalItems === 0) {
        validation.warnings.push('⚠️ Nenhum item encontrado - execute uma coleta primeiro');
      }

      if (!statusCount['A curar'] && !statusCount['Em aprovação']) {
        validation.warnings.push('⚠️ Não há itens para processar na curadoria');
      }

      if (statusCount['Publicado'] > 0) {
        validation.warnings.push(`⚠️ ${statusCount['Publicado']} itens ainda com status antigo "Publicado"`);
      }

      console.log('✅ Validação do fluxo:', validation);
      return validation;
    },
    refetchInterval: 30000, // Revalida a cada 30s
    refetchOnWindowFocus: true,
  });
};