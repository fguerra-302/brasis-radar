import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import { ContentStatus } from '@/types/content';
import { supabase } from '@/integrations/supabase/client';
import { secureApi } from '@/lib/api';
import { useInitializeDefaultSources } from '@/hooks/useInitializeDefaultSources';
import { useInitializeDefaultKeywords } from '@/hooks/useInitializeDefaultKeywords';
import { toast } from 'sonner';
import RadarLiveStats from './RadarLiveStats';
import RadarRecentActions from './RadarRecentActions';
import ContentList from '../content/ContentList';
import AppHeader from '../layout/AppHeader';
import { RadarAutomationStatus } from './RadarAutomationStatus';
import { OnboardingTour } from '@/components/tour/OnboardingTour';

const RadarMain = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();

  const { isInitialized } = useInitializeDefaultSources();
  const { isInitialized: keywordsInitialized } = useInitializeDefaultKeywords();

  useEffect(() => {
    const tourCompleted = localStorage.getItem('brasis-tour-completed');
    if (!tourCompleted) setShowTour(true);
  }, []);

  const { data: supabaseData, isLoading, error, refetch } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

  // Real-time updates
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    const debouncedRefetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => refetch(), 300);
    };

    const channel = supabase
      .channel('radar-realtime-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radar_brasis' }, (payload) => {
        if (payload.new.user_id !== user?.id) {
          toast.info(`Novo conteúdo coletado: "${(payload.new as any).title?.substring(0, 50)}..."`);
        }
        debouncedRefetch();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radar_brasis' }, (payload) => {
        if (payload.new.user_id !== user?.id) debouncedRefetch();
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [refetch, user?.id]);

  const handleAprovar = async (itemId: string, title: string) => {
    if (!user) { toast.error("Faça login para aprovar conteúdo."); return; }
    try {
      await updateMutation.mutateAsync({ id: itemId, payload: { status: ContentStatus.REVIEWING } });
      toast.success(`"${title.substring(0, 40)}..." enviado para aprovação`);
    } catch { toast.error("Falha ao aprovar conteúdo."); }
  };

  const handleIgnorar = async (itemId: string, title: string) => {
    if (!user) { toast.error("Faça login para rejeitar conteúdo."); return; }
    try {
      await updateMutation.mutateAsync({ id: itemId, payload: { status: ContentStatus.REJECTED } });
      toast.success(`"${title.substring(0, 40)}..." rejeitado`);
    } catch { toast.error("Falha ao rejeitar conteúdo."); }
  };

  const handleVerOriginal = (sourceUrl: string, _title: string) => {
    if (sourceUrl && sourceUrl !== '#') window.open(sourceUrl, '_blank');
  };

  const handleConfigurar = () => toast.info("Funcionalidade em desenvolvimento...");

  const handleUpdateStatus = async (itemId: string, status: string, title: string) => {
    if (!user) { toast.error("Faça login para alterar status."); return; }
    try {
      await updateMutation.mutateAsync({ id: itemId, payload: { status: status as ContentStatus } });
      toast.success(`"${title.substring(0, 40)}..." alterado para "${status}"`);
    } catch { toast.error("Falha ao atualizar status."); }
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    if (!user) { toast.error("Faça login para excluir conteúdo."); return; }
    try {
      const { data: item } = await supabase.from('radar_brasis').select('link').eq('id', itemId).single();
      if (!item) throw new Error('Item não encontrado');
      await supabase.from('radar_tombstones').insert({ user_id: user.id, link: item.link, title });
      const { error } = await supabase.from('radar_brasis').delete().eq('id', itemId);
      if (error) throw error;
      toast.success(`"${title.substring(0, 40)}..." excluído`);
      refetch();
    } catch { toast.error("Falha ao excluir item."); }
  };

  const handleBulkDelete = async (status: string) => {
    if (!user) { toast.error("Faça login para excluir conteúdo."); return; }
    try {
      const { data: items } = await supabase.from('radar_brasis').select('id, link, title').eq('status', status).eq('user_id', user.id);
      if (!items || items.length === 0) { toast.info(`Nenhum item com status "${status}".`); return; }
      const tombstones = items.map(item => ({ user_id: user.id, link: item.link, title: item.title }));
      await supabase.from('radar_tombstones').insert(tombstones);
      const { error } = await supabase.from('radar_brasis').delete().eq('status', status).eq('user_id', user.id);
      if (error) throw error;
      toast.success(`${items.length} itens excluídos`);
      refetch();
    } catch { toast.error("Falha ao excluir itens."); }
  };

  const handleExecutarCuradoria = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) { toast.error("Usuário não autenticado."); return; }
    toast.info("Coletando dados das fontes RSS...");
    try {
      const data = await secureApi.invokeFunction('radar-automation', { userId: user.id, manual: true });
      await refetch();
      toast.success(`${data?.processedSources || 0} fontes processadas, ${data?.savedItems || 0} novos itens${data?.minThreshold ? ` (filtro: ≥${data.minThreshold})` : ''}`);
    } catch (error: any) {
      const isSession = error?.message?.includes('Authentication required') || error?.status === 403;
      toast.error(isSession ? "Sessão expirou. Faça login novamente." : "Erro ao coletar dados. Verifique sua conexão.");
    }
  };

  const handleRecalcularRelevancia = async () => await handleExecutarCuradoria();

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <AppHeader />


          {!isInitialized && (
            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-secondary" />
                <p className="text-foreground font-medium font-sans">⚙️ Configurando fontes RSS padrão...</p>
              </div>
            </div>
          )}

          <RadarLiveStats />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ContentList
                supabaseData={supabaseData} isLoading={isLoading} error={error}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                currentPage={currentPage} setCurrentPage={setCurrentPage}
                onAprovar={handleAprovar} onIgnorar={handleIgnorar}
                onVerOriginal={handleVerOriginal} onUpdateStatus={handleUpdateStatus}
                onConfigurar={handleConfigurar} onExecutarCuradoria={handleExecutarCuradoria}
                onRecalcularRelevancia={user ? handleRecalcularRelevancia : undefined}
                onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete}
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

      {showTour && <OnboardingTour onClose={() => setShowTour(false)} />}
    </>
  );
};

export default RadarMain;
