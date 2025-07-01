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
  console.log('RadarMain component rendering');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Hooks do Supabase
  const { data: supabaseData, isLoading, error, refetch } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

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
      title: "🚀 Curadoria IA Iniciada",
      description: "Coletando e analisando notícias do Brasil...",
    });
    
    try {
      console.log('Executando curadoria real...');
      
      // Chama a edge function do Supabase
      const response = await fetch('/api/curadoria-radar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await refetch(); // Atualiza os dados na tela
        
        toast({
          title: "✅ Curadoria Concluída",
          description: `${result.processed} novos conteúdos coletados e analisados! Total encontrado: ${result.total_found}`,
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('Erro na curadoria:', error);
      toast({
        title: "❌ Erro na Curadoria",
        description: error instanceof Error ? error.message : "Falha ao executar curadoria. Verifique as configurações.",
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
