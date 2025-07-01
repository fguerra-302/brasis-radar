
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Bot } from 'lucide-react';
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import RadarLiveStats from './RadarLiveStats';
import RadarRecentActions from './RadarRecentActions';
import RadarContent from './RadarContent';
import RadarHeader from './RadarHeader';

const RadarMain = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Hooks do Supabase
  const { data: supabaseData, isLoading, error, refetch } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

  console.log('Dados do Supabase:', { supabaseData, isLoading, error });

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
        title: "❌ Conteúdo Ignorado",
        description: `"${title}" foi marcado como ignorado.`,
      });
    } catch (error) {
      console.error('Erro ao ignorar:', error);
      toast({
        title: "Erro",
        description: "Falha ao ignorar conteúdo.",
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
      description: "Abrindo painel de configurações...",
    });
  };

  const handleExecutarCuradoria = async () => {
    toast({
      title: "🚀 Curadoria IA Iniciada",
      description: "Executando curadoria automática...",
    });
    
    try {
      // Simula delay da curadoria
      setTimeout(async () => {
        await refetch();
        toast({
          title: "✅ Curadoria Concluída",
          description: "Novos conteúdos foram coletados e analisados!",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao executar curadoria.",
        variant: "destructive",
      });
    }
  };

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
