
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Bot, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import { ContentStatus } from '@/types/content';
import { supabase } from '@/integrations/supabase/client';
import { secureApi } from '@/lib/api';
import { useInitializeDefaultSources } from '@/hooks/useInitializeDefaultSources';
import RadarLiveStats from './RadarLiveStats';
import RadarRecentActions from './RadarRecentActions';
import ContentList from '../content/ContentList';
import AppHeader from '../layout/AppHeader';
import { RadarAutomationStatus } from './RadarAutomationStatus';
import { OnboardingTour } from '@/components/tour/OnboardingTour';

const RadarMain = () => {
  console.log('🎯 RadarMain iniciando - versão sem autenticação');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showTour, setShowTour] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Inicializar fontes RSS padrão
  const { isInitialized } = useInitializeDefaultSources();

  // Verificar se deve mostrar o tour na primeira visita
  useEffect(() => {
    const tourCompleted = localStorage.getItem('brasis-tour-completed');
    if (!tourCompleted) {
      setShowTour(true);
    }
  }, []);

  // Hooks do Supabase sem autenticação
  const { data: supabaseData, isLoading, error, refetch } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

  console.log('📊 RadarMain - Estado atual:', { 
    supabaseData: supabaseData?.length || 0, 
    isLoading, 
    error: error?.message,
    isInitialized
  });

  // Real-time updates para coleta automatizada
  useEffect(() => {
    console.log('🔄 Configurando real-time updates...');
    
    const channel = supabase
      .channel('radar-realtime-updates')
        .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'radar_brasis'
        },
        (payload) => {
          console.log('🚀 Novo item coletado automaticamente:', payload.new);
          toast({
            title: "🆕 Novo Conteúdo Coletado",
            description: `"${payload.new.title?.substring(0, 50)}..." foi adicionado pelo sistema automatizado.`,
          });
          refetch(); // Atualiza a lista
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'radar_brasis'
        },
        (payload) => {
          console.log('📝 Item atualizado:', payload.new);
          refetch(); // Atualiza a lista
        }
      )
      .subscribe((status) => {
        console.log('📡 Status real-time subscription:', status);
      });

    return () => {
      console.log('🔌 Removendo channel real-time...');
      supabase.removeChannel(channel);
    };
  }, [toast, refetch]);

  const handleAprovar = async (itemId: string, title: string) => {
    if (!user) {
      toast({
        title: "🔐 Login Necessário",
        description: "Faça login para aprovar conteúdo. Clique no link acima.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        payload: { status: ContentStatus.REVIEWING }
      });
      
      toast({
        title: "✅ Conteúdo Aprovado",
        description: `"${title.substring(0, 40)}..." foi enviado para aprovação final.`,
      });
    } catch (error) {
      console.error('❌ Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: "Falha ao aprovar conteúdo.",
        variant: "destructive",
      });
    }
  };

  const handleIgnorar = async (itemId: string, title: string) => {
    if (!user) {
      toast({
        title: "🔐 Login Necessário",
        description: "Faça login para rejeitar conteúdo. Clique no link acima.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        payload: { status: ContentStatus.REJECTED }
      });
      
      toast({
        title: "❌ Conteúdo Rejeitado",
        description: `"${title.substring(0, 40)}..." foi marcado como rejeitado.`,
      });
    } catch (error) {
      console.error('❌ Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: "Falha ao rejeitar conteúdo.",
        variant: "destructive",
      });
    }
  };

  const handleVerOriginal = (sourceUrl: string, title: string) => {
    toast({
      title: "🔗 Abrindo Original",
      description: `Abrindo link de "${title.substring(0, 30)}...".`,
    });
    if (sourceUrl && sourceUrl !== '#') {
      window.open(sourceUrl, '_blank');
    }
  };

  const handleConfigurar = () => {
    toast({
      title: "⚙️ Configurações",
      description: "Funcionalidade em desenvolvimento...",
    });
  };

  const handleUpdateStatus = async (itemId: string, status: string, title: string) => {
    if (!user) {
      toast({
        title: "🔐 Login Necessário",
        description: "Faça login para alterar status. Clique no link acima.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        payload: { status: status as ContentStatus }
      });
      
      toast({
        title: "✅ Status Atualizado",
        description: `"${title.substring(0, 40)}..." foi alterado para "${status}".`,
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    console.log('🗑️ Excluindo item:', itemId);
    
    try {
      const { error } = await supabase
        .from('radar_brasis')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      toast({
        title: "✅ Item Excluído",
        description: `"${title.substring(0, 40)}..." foi excluído permanentemente.`,
      });
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error('❌ Erro ao excluir item:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir item.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async (status: string) => {
    console.log('🗑️ Excluindo itens em lote:', status);
    
    try {
      const { error } = await supabase
        .from('radar_brasis')
        .delete()
        .eq('status', status);
      
      if (error) throw error;
      
      toast({
        title: "✅ Itens Excluídos",
        description: `Todos os itens com status "${status}" foram excluídos.`,
      });
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error('❌ Erro ao excluir itens em lote:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir itens.",
        variant: "destructive",
      });
    }
  };

  const handleExecutarCuradoria = async () => {
    console.log('🚀 Executando coleta manual...');
    
    // Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      toast({
        title: "❌ Erro",
        description: "Usuário não autenticado. Faça login primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "🤖 Coleta Iniciada",
      description: "Coletando dados das fontes RSS configuradas...",
    });
    
    try {
      const data = await secureApi.invokeFunction('radar-automation', {
        userId: user.id, 
        manual: true 
      });
      
      console.log('✅ Resultado da coleta:', data);
      await refetch();
      
      toast({
        title: "✅ Coleta Concluída",
        description: `${data?.processedSources || 0} fontes processadas, ${data?.savedItems || 0} novos itens coletados.`,
      });
      
    } catch (error: any) {
      console.error('❌ Erro na coleta:', error);
      
      const isSessionExpired = error?.message?.includes('Authentication required') || 
                               error?.status === 403 || 
                               error?.message?.includes('JWT');
      
      toast({
        title: "Erro na Coleta",
        description: isSessionExpired 
          ? "Sua sessão expirou. Faça login novamente." 
          : "Erro ao coletar dados das fontes RSS. Verifique sua conexão.",
        variant: "destructive",
      });
    }
  };

  const handleRecalcularRelevancia = async () => {
    console.log('🔄 Recalculando relevância...');
    
    // Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      toast({
        title: "❌ Erro",
        description: "Usuário não autenticado. Faça login primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "🔄 Recálculo Iniciado",
      description: "Recalculando relevância de todos os itens...",
    });

    try {
      const response = await secureApi.invokeFunction('rescore-content');
      
      if (response?.processedItems >= 0) {
        toast({
          title: "✅ Recálculo Concluído",
          description: `${response.processedItems} itens processados, ${response.updatedItems || 0} atualizados.`,
        });
        
        // Força o refetch dos dados
        refetch();
      } else {
        toast({
          title: "⚠️ Aviso",
          description: response?.message || "Nenhum item encontrado para recalcular.",
        });
      }
    } catch (error) {
      console.error('Erro no recálculo:', error);
      toast({
        title: "❌ Erro no Recálculo",
        description: "Erro ao recalcular relevância. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  console.log('🎯 RadarMain - Renderizando interface');

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <AppHeader />
          
          {!user && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-orange-600" />
                <p className="text-orange-800 font-medium">
                  🎭 Modo Demonstração — <a href="/auth" className="underline hover:no-underline">faça login</a> para curar conteúdo
                </p>
              </div>
            </div>
          )}
          
          {!isInitialized && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <p className="text-blue-800 font-medium">
                  ⚙️ Configurando fontes RSS padrão pela primeira vez...
                </p>
              </div>
            </div>
          )}
          
          <RadarLiveStats />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ContentList
                supabaseData={supabaseData}
                isLoading={isLoading}
                error={error}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onAprovar={handleAprovar}
                onIgnorar={handleIgnorar}
                onVerOriginal={handleVerOriginal}
                onUpdateStatus={handleUpdateStatus}
                onConfigurar={handleConfigurar}
                onExecutarCuradoria={handleExecutarCuradoria}
                onRecalcularRelevancia={user ? handleRecalcularRelevancia : undefined}
                onDeleteItem={handleDeleteItem}
                onBulkDelete={handleBulkDelete}
                updateMutation={updateMutation}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="space-y-6">
                <RadarAutomationStatus />
                <RadarRecentActions />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showTour && (
        <OnboardingTour onClose={() => setShowTour(false)} />
      )}
      
      <Toaster />
    </>
  );
};

export default RadarMain;
