import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import { ContentStatus } from '@/types/content';
import { supabase } from '@/integrations/supabase/client';
import { secureApi } from '@/lib/api';
import { logAudit, logBulk, fetchPreviousStatus } from '@/lib/auditLog';

import { useInitializeDefaultKeywords } from '@/hooks/useInitializeDefaultKeywords';
import { useInitializeDefaultGroups } from '@/hooks/useInitializeDefaultGroups';
import { toast } from 'sonner';
import RadarLiveStats from './RadarLiveStats';
import RadarRecentActions from './RadarRecentActions';
import ContentList from '../content/ContentList';
import AppHeader from '../layout/AppHeader';
import { RadarAutomationStatus } from './RadarAutomationStatus';
import { LastAutomationRun } from './LastAutomationRun';
import { OnboardingTour } from '@/components/tour/OnboardingTour';

const RadarMain = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [groupFilter, setGroupFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();

  const { isInitialized: keywordsInitialized } = useInitializeDefaultKeywords();
  useInitializeDefaultGroups();

  useEffect(() => {
    const tourCompleted = localStorage.getItem('brasis-tour-completed');
    if (!tourCompleted) setShowTour(true);
  }, []);

  const queryClient = useQueryClient();
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
      const prev = await fetchPreviousStatus(itemId);
      await updateMutation.mutateAsync({ id: itemId, payload: { status: ContentStatus.REVIEWING } });
      await logAudit({ itemId, action: 'approve', previousStatus: prev, newStatus: ContentStatus.REVIEWING, metadata: { title } });
      toast.success(`"${title.substring(0, 40)}..." enviado para aprovação`);
    } catch { toast.error("Falha ao aprovar conteúdo."); }
  };

  const handleIgnorar = async (itemId: string, title: string) => {
    if (!user) { toast.error("Faça login para rejeitar conteúdo."); return; }
    try {
      const prev = await fetchPreviousStatus(itemId);
      await updateMutation.mutateAsync({ id: itemId, payload: { status: ContentStatus.REJECTED } });
      await logAudit({ itemId, action: 'reject', previousStatus: prev, newStatus: ContentStatus.REJECTED, metadata: { title } });
      toast.success(`"${title.substring(0, 40)}..." rejeitado`);
    } catch { toast.error("Falha ao rejeitar conteúdo."); }
  };

  const handleVerOriginal = (sourceUrl: string, _title: string) => {
    if (sourceUrl && sourceUrl !== '#') window.open(sourceUrl, '_blank');
  };

  

  const handleUpdateStatus = async (itemId: string, status: string, title: string) => {
    if (!user) { toast.error("Faça login para alterar status."); return; }
    try {
      const prev = await fetchPreviousStatus(itemId);
      await updateMutation.mutateAsync({ id: itemId, payload: { status: status as ContentStatus } });
      await logAudit({ itemId, action: 'status_change', previousStatus: prev, newStatus: status, metadata: { title } });
      toast.success(`"${title.substring(0, 40)}..." alterado para "${status}"`);
    } catch { toast.error("Falha ao atualizar status."); }
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    if (!user) { toast.error("Faça login para excluir conteúdo."); return; }
    try {
      const { data: item } = await supabase.from('radar_brasis').select('link, status').eq('id', itemId).single();
      if (!item) throw new Error('Item não encontrado');
      await supabase.from('radar_tombstones').insert({ user_id: user.id, link: item.link, title });
      await logAudit({ itemId, action: 'delete', previousStatus: item.status as string, newStatus: null, metadata: { title, link: item.link } });
      const { error } = await supabase.from('radar_brasis').delete().eq('id', itemId);
      if (error) throw error;
      toast.success(`"${title.substring(0, 40)}..." excluído`);
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
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
      const actionMap: Record<string, any> = {
        'Coletado': 'bulk_delete_collected',
        'Ignorado': 'bulk_delete_rejected',
        'Em aprovação': 'bulk_delete_approval',
      };
      await logBulk(actionMap[status] || 'bulk_delete_collected', items.length, { status });
      toast.success(`${items.length} itens excluídos`);
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    } catch { toast.error("Falha ao excluir itens."); }
  };

  const handleBulkDeleteIds = async (ids: string[]) => {
    if (!user) { toast.error("Faça login para excluir conteúdo."); return; }
    if (ids.length === 0) return;
    try {
      const { data: items } = await supabase.from('radar_brasis').select('id, link, title').in('id', ids).eq('user_id', user.id);
      if (!items || items.length === 0) { toast.info('Nenhum item encontrado.'); return; }
      const tombstones = items.map(item => ({ user_id: user.id, link: item.link, title: item.title }));
      await supabase.from('radar_tombstones').insert(tombstones);
      const { error } = await supabase.from('radar_brasis').delete().in('id', ids).eq('user_id', user.id);
      if (error) throw error;
      await logBulk('bulk_delete_filtered', items.length, { ids: items.length });
      toast.success(`${items.length} itens excluídos`);
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
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

  // Removed duplicate "Recalcular Relevância" — it was an alias for handleExecutarCuradoria

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <AppHeader />



          <RadarLiveStats />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ContentList
                supabaseData={supabaseData} isLoading={isLoading} error={error}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                groupFilter={groupFilter} setGroupFilter={setGroupFilter}
                currentPage={currentPage} setCurrentPage={setCurrentPage}
                onAprovar={handleAprovar} onIgnorar={handleIgnorar}
                onVerOriginal={handleVerOriginal} onUpdateStatus={handleUpdateStatus}
                onExecutarCuradoria={handleExecutarCuradoria}
                onRecalcularRelevancia={undefined}
                onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete} onBulkDeleteIds={handleBulkDeleteIds}
                updateMutation={updateMutation}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <RadarAutomationStatus />
                <LastAutomationRun />
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
