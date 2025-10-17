
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Bot, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
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

  // ⚡ OTIMIZAÇÃO 2: Real-time com filtros condicionais + debounce
  useEffect(() => {
    console.log('🔄 Configurando real-time updates otimizados...');
    
    // Debounce para evitar múltiplos refetches simultâneos
    let debounceTimer: NodeJS.Timeout;
    const debouncedRefetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('⚡ Executando refetch debounced');
        refetch();
      }, 300); // 300ms debounce
    };
    
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
          
          // ⚡ Filtro condicional: só mostrar toast se não for do próprio usuário
          if (payload.new.user_id !== user?.id) {
            toast({
              title: "🆕 Novo Conteúdo Coletado",
              description: `"${payload.new.title?.substring(0, 50)}..." foi adicionado pelo sistema automatizado.`,
            });
          }
          
          debouncedRefetch(); // Usar debounced ao invés de refetch direto
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
          
          // ⚡ Filtro condicional: ignorar updates do próprio usuário (já otimistic)
          if (payload.new.user_id !== user?.id) {
            debouncedRefetch();
          } else {
            console.log('⏭️ Ignorando update do próprio usuário (optimistic UI)');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status real-time subscription:', status);
      });

    return () => {
      console.log('🔌 Removendo channel real-time...');
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [toast, refetch, user?.id]);

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
    console.log('🗑️ Excluindo item permanentemente:', itemId);
    
    if (!user) {
      toast({
        title: "🔐 Login Necessário",
        description: "Faça login para excluir conteúdo.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // 1. Buscar link do item antes de excluir
      const { data: item } = await supabase
        .from('radar_brasis')
        .select('link')
        .eq('id', itemId)
        .single();

      if (!item) throw new Error('Item não encontrado');

      // 2. Criar tombstone antes de excluir
      const { error: tombstoneError } = await supabase
        .from('radar_tombstones')
        .insert({
          user_id: user.id,
          link: item.link,
          title: title
        });

      if (tombstoneError) {
        console.warn('⚠️ Erro ao criar tombstone:', tombstoneError);
        // Continuar mesmo com erro no tombstone
      }

      // 3. Excluir item
      const { error } = await supabase
        .from('radar_brasis')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      toast({
        title: "✅ Item Excluído",
        description: `"${title.substring(0, 40)}..." não será mais coletado.`,
      });
      
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
    
    if (!user) {
      toast({
        title: "🔐 Login Necessário",
        description: "Faça login para excluir conteúdo.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // 1. Buscar todos os itens com esse status
      const { data: items } = await supabase
        .from('radar_brasis')
        .select('id, link, title')
        .eq('status', status)
        .eq('user_id', user.id);

      if (!items || items.length === 0) {
        toast({
          title: "Nenhum item encontrado",
          description: `Não há itens com status "${status}".`,
        });
        return;
      }

      // 2. Criar tombstones para cada item
      const tombstones = items.map(item => ({
        user_id: user.id,
        link: item.link,
        title: item.title
      }));

      const { error: tombstoneError } = await supabase
        .from('radar_tombstones')
        .insert(tombstones);

      if (tombstoneError) {
        console.warn('⚠️ Erro ao criar tombstones:', tombstoneError);
      }

      // 3. Excluir itens
      const { error } = await supabase
        .from('radar_brasis')
        .delete()
        .eq('status', status)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "✅ Itens Excluídos",
        description: `${items.length} itens não serão mais coletados.`,
      });
      
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
        description: `${data?.processedSources || 0} fontes processadas, ${data?.savedItems || 0} novos itens coletados${data?.minThreshold ? ` (filtro: ≥${data.minThreshold})` : ''}.`,
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
    console.log('🔄 Recalculando relevância via nova coleta...');
    
    // Just run a new collection to refresh items with current settings
    await handleExecutarCuradoria();
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
                  🎭 Modo Demonstração — <Link to="/auth" className="underline hover:no-underline">faça login</Link> para curar conteúdo
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
