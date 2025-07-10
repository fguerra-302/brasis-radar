import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Bot } from 'lucide-react';
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import { ContentStatus } from '@/types/content';
import { supabase } from '@/integrations/supabase/client';
import RadarLiveStats from './RadarLiveStats';
import RadarRecentActions from './RadarRecentActions';
import ContentList from '../content/ContentList';
import AppHeader from '../layout/AppHeader';
import { RadarAutomationStatus } from './RadarAutomationStatus';
import { OnboardingTour } from '@/components/tour/OnboardingTour';

const RadarMain = () => {
  console.log('RadarMain component rendering');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showTour, setShowTour] = useState(false);
  const { toast } = useToast();

  // Verificar se deve mostrar o tour na primeira visita
  useEffect(() => {
    const tourCompleted = localStorage.getItem('brasis-tour-completed');
    if (!tourCompleted) {
      setShowTour(true);
    }
  }, []);

  // Hooks do Supabase simplificados
  const { data: supabaseData, isLoading, error, refetch } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

  console.log('RadarMain - Dados do Supabase:', { supabaseData, isLoading, error });

  // Real-time updates para coleta automatizada
  useEffect(() => {
    const channel = supabase
      .channel('radar-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'radar_brasis'
        },
        (payload) => {
          console.log('Novo item coletado automaticamente:', payload);
          toast({
            title: "🚀 Novo Item Coletado",
            description: `"${payload.new.title}" foi adicionado automaticamente.`,
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
          console.log('Item atualizado:', payload);
          refetch(); // Atualiza a lista
        }
      )
      .subscribe();

    return () => {
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
        description: `"${title}" foi enviado para aprovação final. Acesse a área de Curadoria para definir se vai para Newsletter ou Redes Sociais.`,
      });
    } catch (error) {
      console.error('Erro ao aprovar:', error);
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
        description: `"${title}" foi marcado como rejeitado.`,
      });
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
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
      description: `Abrindo link original de "${title}".`,
    });
    if (sourceUrl && sourceUrl !== '#') {
      window.open(sourceUrl, '_blank');
    }
  };

  const handleConfigurar = () => {
    toast({
      title: "⚙️ Configurações",
      description: "Abrindo painel de configurações da curadoria...",
    });
    // Aqui você pode abrir um modal de configurações
  };

  const handleUpdateStatus = async (itemId: string, status: string, title: string) => {
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        payload: { status: status as ContentStatus }
      });
      
      toast({
        title: "✅ Status Atualizado",
        description: `"${title}" foi alterado para "${status}".`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  const handleExecutarCuradoria = async () => {
    toast({
      title: "🚀 Coleta Iniciada",
      description: "Coletando dados das fontes RSS...",
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('radar-automation');
      
      if (error) {
        throw error;
      }
      
      await refetch();
      
      toast({
        title: "✅ Coleta Concluída",
        description: `${data?.processedSources || 0} fontes processadas, ${data?.savedItems || 0} itens coletados.`,
      });
      
    } catch (error) {
      console.error('Erro na coleta:', error);
      toast({
        title: "❌ Erro na Coleta",
        description: error instanceof Error ? error.message : "Falha ao coletar dados.",
        variant: "destructive",
      });
    }
  };

  console.log('RadarMain - Pronto para renderizar');

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <AppHeader />
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
