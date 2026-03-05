import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalApiService, ExternalApiResult } from '@/services/externalApiService';
import { useToast } from '@/hooks/use-toast';
import { useSharedSources } from './useSharedSources';

/**
 * Hook para gerenciar operações com a API externa
 */
export const useExternalApi = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sources } = useSharedSources();

  // Query para verificar status da API externa
  const apiHealthQuery = useQuery({
    queryKey: ['external-api-health'],
    queryFn: ExternalApiService.checkHealth,
    refetchInterval: 30000, // Verificar a cada 30 segundos
    retry: 2
  });

  // Mutation para sincronizar uma fonte específica
  const syncSourceMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const source = sources?.find(s => s.id === sourceId);
      if (!source) {
        throw new Error('Fonte não encontrada');
      }
      return ExternalApiService.syncSource(source as any);
    },
    onSuccess: (result, sourceId) => {
      if (result.success) {
        toast({
          title: "✅ Sincronização Concluída",
          description: result.message || "Fonte sincronizada com sucesso",
        });
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
        queryClient.invalidateQueries({ queryKey: ['radar-sources'] });
      } else {
        toast({
          title: "❌ Erro na Sincronização",
          description: result.error || "Falha ao sincronizar fonte",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para sincronizar todas as fontes
  const syncAllSourcesMutation = useMutation({
    mutationFn: ExternalApiService.syncAllSources,
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "✅ Sincronização Completa",
          description: result.message || "Todas as fontes foram sincronizadas",
        });
      } else {
        toast({
          title: "⚠️ Sincronização com Problemas",
          description: result.error || "Algumas fontes falharam",
          variant: "destructive",
        });
      }
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
      queryClient.invalidateQueries({ queryKey: ['radar-sources'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro na Sincronização",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para testar uma fonte
  const testSourceMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const source = sources?.find(s => s.id === sourceId);
      if (!source) {
        throw new Error('Fonte não encontrada');
      }
      return ExternalApiService.testSource(source as any);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "✅ Teste Bem-sucedido",
          description: result.message || "Fonte está funcionando corretamente",
        });
      } else {
        toast({
          title: "❌ Teste Falhou",
          description: result.error || "Fonte não está acessível",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro no Teste",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    // Status da API
    isApiHealthy: apiHealthQuery.data || false,
    isCheckingHealth: apiHealthQuery.isFetching,
    
    // Sincronização
    syncSource: syncSourceMutation.mutate,
    syncAllSources: syncAllSourcesMutation.mutate,
    isSyncingSource: syncSourceMutation.isPending,
    isSyncingAll: syncAllSourcesMutation.isPending,
    
    // Teste
    testSource: testSourceMutation.mutate,
    isTesting: testSourceMutation.isPending,
    
    // Refresh da saúde da API
    refreshApiHealth: apiHealthQuery.refetch
  };
};