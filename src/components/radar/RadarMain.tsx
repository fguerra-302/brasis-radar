import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Bot } from 'lucide-react';
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import { useDataCollector } from '@/hooks/useDataCollector';
import RadarLiveStats from './RadarLiveStats';
import RadarRecentActions from './RadarRecentActions';
import RadarContent from './RadarContent';
import RadarHeader from './RadarHeader';

const RadarMain = () => {
  console.log('RadarMain component rendering');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Hooks do Supabase
  const { data: supabaseData, isLoading, error, refetch } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();
  const dataCollectorMutation = useDataCollector();

  console.log('RadarMain - Dados do Supabase:', { supabaseData, isLoading, error });

  const handleAprovar = async (itemId: string, title: string) => {
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        payload: { status: 'Publicado' }
      });
      
      toast({
        title: "✅ Conteúdo Aprovado",
        description: `"${title}" foi aprovado para publicação.`,
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
        payload: { status: 'Ignorado' }
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

  const handleVerOriginal = (link: string, title: string) => {
    toast({
      title: "🔗 Abrindo Original",
      description: `Abrindo link original de "${title}".`,
    });
    if (link && link !== '#') {
      window.open(link, '_blank');
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
    toast({
      title: "🚀 Coleta de Dados Iniciada",
      description: "Coletando de todas as fontes ativas...",
    });
    
    try {
      console.log('Executando coleta de dados...');
      
      // Usar o hook de coleta
      const result = await dataCollectorMutation.mutateAsync();
      
      toast({
        title: "✅ Coleta Concluída",
        description: `${result.total_items} itens coletados de ${result.successful_sources}/${result.total_sources} fontes.`,
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
          <RadarHeader />
          <RadarLiveStats />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <RadarContent
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
              <RadarRecentActions />
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
};

export default RadarMain;
