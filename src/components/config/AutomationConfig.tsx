import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  Database, 
  Trash2,
  RefreshCw,
  Activity
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AutomationConfig = () => {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [collectionInterval, setCollectionInterval] = useState(30);
  const [cleanupEnabled, setCleanupEnabled] = useState(true);
  const [cleanupDays, setCleanupDays] = useState(30);
  const { toast } = useToast();

  // Buscar estatísticas da automação
  const { data: stats } = useQuery({
    queryKey: ['automation-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalItems, todayItems, statusCounts] = await Promise.all([
        supabase.from('radar_brasis').select('id', { count: 'exact' }),
        supabase.from('radar_brasis')
          .select('id', { count: 'exact' })
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
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const handleRunManualCollection = async () => {
    toast({
      title: "🚀 Coleta Manual Iniciada",
      description: "Executando coleta de todas as fontes configuradas...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('radar-automation', {
        body: { manual: true }
      });

      if (error) throw error;

      toast({
        title: "✅ Coleta Concluída",
        description: `Coletados ${data.savedItems || 0} novos itens.`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro na Coleta",
        description: "Falha ao executar coleta manual.",
        variant: "destructive",
      });
    }
  };

  const handleClearOldItems = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);

      const { error } = await supabase
        .from('radar_brasis')
        .delete()
        .eq('status', 'Ignorado')
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      toast({
        title: "🗑️ Limpeza Concluída",
        description: "Itens antigos ignorados foram removidos.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao limpar itens antigos.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Automação da Coleta</h2>
        <p className="text-slate-600">
          Configure e monitore a coleta automatizada de conteúdos
        </p>
      </div>

      {/* Estatísticas */}
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

      {/* Configurações de Automação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Coleta Automatizada</Label>
                <p className="text-sm text-slate-600">Executar coleta a cada intervalo definido</p>
              </div>
              <Switch
                checked={automationEnabled}
                onCheckedChange={setAutomationEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Intervalo da Coleta (minutos)</Label>
              <Input
                id="interval"
                type="number"
                value={collectionInterval}
                onChange={(e) => setCollectionInterval(Number(e.target.value))}
                min="5"
                max="1440"
              />
              <p className="text-xs text-slate-500">
                Recomendado: 30 minutos para fontes RSS
              </p>
            </div>

            <Badge variant={automationEnabled ? "default" : "secondary"}>
              {automationEnabled ? "Ativa" : "Pausada"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Limpeza Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Limpeza Semanal</Label>
                <p className="text-sm text-slate-600">Remove itens ignorados antigos</p>
              </div>
              <Switch
                checked={cleanupEnabled}
                onCheckedChange={setCleanupEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleanup-days">Manter por (dias)</Label>
              <Input
                id="cleanup-days"
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Number(e.target.value))}
                min="1"
                max="365"
              />
              <p className="text-xs text-slate-500">
                Itens ignorados mais antigos que este período serão removidos
              </p>
            </div>

            <Badge variant={cleanupEnabled ? "default" : "secondary"}>
              {cleanupEnabled ? "Habilitada" : "Desabilitada"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Ações Manuais */}
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
                    que são mais antigos que {cleanupDays} dias.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancelar</Button>
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