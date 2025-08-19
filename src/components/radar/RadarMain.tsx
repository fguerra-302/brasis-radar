
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Bot } from 'lucide-react';
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import { ContentStatus } from '@/types/content';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase.functions.invoke('radar-automation', {
        body: { userId: user.id, manual: true }
      });
      
      if (error) {
        console.error('❌ Erro na função:', error);
        throw error;
      }
      
      console.log('✅ Resultado da coleta:', data);
      await refetch();
      
      toast({
        title: "✅ Coleta Concluída",
        description: `${data?.processedSources || 0} fontes processadas, ${data?.savedItems || 0} novos itens coletados.`,
      });
      
    } catch (error) {
      console.error('❌ Erro na coleta:', error);
      toast({
        title: "❌ Erro na Coleta",
        description: error instanceof Error ? error.message : "Falha ao coletar dados das fontes RSS.",
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
