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

  const handleExecutarCuradoria = async () => {
    console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...');
    
    toast({
      title: "🔍 Diagnóstico Iniciado",
      description: "Testando todas as conexões e fontes...",
    });
    
    try {
      // 1. Verificar fontes ativas
      console.log('1. Verificando fontes ativas...');
      const { data: sources, error: sourcesError } = await supabase
        .from('radar_sources')
        .select('*')
        .eq('active', true);
      
      console.log('Fontes ativas encontradas:', sources);
      if (sourcesError) {
        console.error('Erro ao buscar fontes:', sourcesError);
        throw new Error(`Erro ao buscar fontes: ${sourcesError.message}`);
      }

      if (!sources || sources.length === 0) {
        throw new Error('Nenhuma fonte ativa encontrada! Configure fontes primeiro.');
      }

      // 2. Testar conectividade com cada fonte
      console.log('2. Testando conectividade das fontes...');
      for (const source of sources) {
        try {
          console.log(`Testando fonte: ${source.name} (${source.type}) - ${source.url}`);
          
          if (source.type === 'RSS') {
            const response = await fetch(source.url);
            console.log(`✅ ${source.name}: HTTP ${response.status}`);
            
            if (!response.ok) {
              console.warn(`⚠️ ${source.name}: Status ${response.status}`);
            }
          } else if (source.type === 'SPOTIFY') {
            console.log(`🎵 ${source.name}: Configurada (credenciais necessárias)`);
          } else if (source.type === 'IBGE') {
            console.log(`📊 ${source.name}: Configurada`);
          }
        } catch (err) {
          console.error(`❌ Erro testando ${source.name}:`, err);
        }
      }

      // 3. Executar edge function
      console.log('3. Executando radar-automation...');
      const { data, error } = await supabase.functions.invoke('radar-automation');
      
      console.log('Resposta da edge function:', { data, error });
      
      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw error;
      }
      
      // 4. Atualizar dados
      console.log('4. Atualizando interface...');
      await refetch();
      
      // 5. Verificar novos dados
      const { data: newData } = await supabase
        .from('radar_brasis')
        .select('source, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('Últimos dados coletados:', newData);
      
      toast({
        title: "✅ Diagnóstico Completo",
        description: `✅ ${sources.length} fontes testadas\n✅ ${data?.processedSources || 0} fontes processadas\n✅ ${data?.savedItems || 0} itens salvos`,
      });
      
    } catch (error) {
      console.error('❌ ERRO NO DIAGNÓSTICO:', error);
      toast({
        title: "❌ Erro no Diagnóstico",
        description: error instanceof Error ? error.message : "Falha no teste do sistema.",
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
