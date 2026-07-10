import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Play,
  Settings,
  Database,
  Trash2,
  RefreshCw,
  Activity,
  Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { secureApi } from '@/lib/api';

const CLEANUP_DAYS = 30;

export const AutomationConfig = () => {
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['automation-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalItems, todayItems, statusCounts] = await Promise.all([
        supabase.from('radar_brasis').select('id', { count: 'exact', head: true }),
        supabase.from('radar_brasis')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase.from('radar_brasis')
          .select('status')
          .then(({ data }) => {
            const counts = data?.reduce((acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {};
            return counts;
          })
      ]);

      return {
        total: totalItems.count || 0,
        today: todayItems.count || 0,
        statusCounts
      };
    },
    refetchInterval: 30000
  });

  const handleRunManualCollection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      toast({ title: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    toast({
      title: "🚀 Coleta Iniciada",
      description: "Executando coleta de todas as fontes ativas (RSS + Web)...",
    });

    try {
      const data = await secureApi.invokeFunction('radar-automation', { userId: user.id, manual: true });
      toast({
        title: "✅ Coleta Concluída",
        description: `${data?.processedSources || 0} fontes processadas · ${data?.savedItems || 0} novos itens${data?.minThreshold ? ` (filtro ≥${data.minThreshold})` : ''}`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro na Coleta",
        description: error?.message || "Falha ao executar coleta manual.",
        variant: "destructive",
      });
    }
  };

  const handleClearOldItems = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);

      const { error } = await supabase
        .from('radar_brasis')
        .delete()
        .eq('status', 'Ignorado')
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      toast({
        title: "🗑️ Limpeza Concluída",
        description: `Itens rejeitados com mais de ${CLEANUP_DAYS} dias foram removidos.`,
      });
    } catch {
      toast({ title: "Erro", description: "Falha ao limpar itens antigos.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Automação da Coleta</h2>
        <p className="text-slate-600">
          Monitore a coleta automatizada e execute manualmente quando necessário
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Itens</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Coletados Hoje</p>
                <p className="text-2xl font-bold text-green-600">{stats?.today || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Em Aprovação</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.statusCounts?.['Em aprovação'] || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Publicados</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.statusCounts?.['Publicado'] || 0}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Coleta Automatizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700">
              <p className="font-medium">Coleta agendada ativa</p>
              <p className="text-slate-600 mt-1">
                A coleta é executada automaticamente pelo cron do Supabase a cada 30 minutos.
                O cap por fonte é <strong>15 itens</strong> e a relevância mínima segue as configurações do usuário.
                Use o botão abaixo para forçar uma coleta imediata.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Ativa</Badge>
            <span className="text-xs text-muted-foreground">Cron interno · não requer configuração manual</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações Manuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRunManualCollection} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Executar Coleta Agora
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpar Itens Antigos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Limpeza</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    Esta ação irá remover permanentemente todos os itens com status "Ignorado"
                    que são mais antigos que {CLEANUP_DAYS} dias.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={handleClearOldItems}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Confirmar Limpeza
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
