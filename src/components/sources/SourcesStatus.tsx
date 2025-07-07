import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRadarSources } from '@/hooks/useRadarConfig';

export const SourcesStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: sources, isLoading } = useRadarSources();

  // Verificar últimas coletas
  const { data: recentCollections } = useQuery({
    queryKey: ['recent-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('source, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const testSourceMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke('multi-source-collector', {
        body: { action: 'test-source', sourceId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-collections'] });
      toast({
        title: "✅ Teste realizado",
        description: "Fonte testada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro no teste",
        description: "Falha ao testar a fonte.",
        variant: "destructive",
      });
    },
  });

  const getSourceStatus = (sourceName: string) => {
    if (!recentCollections) return 'unknown';
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentFromSource = recentCollections.filter(
      item => item.source === sourceName && new Date(item.created_at) > yesterday
    );
    
    if (recentFromSource.length > 0) return 'working';
    
    const anyFromSource = recentCollections.find(item => item.source === sourceName);
    if (anyFromSource) return 'stale';
    
    return 'never';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'stale': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'never': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'working': return 'Funcionando';
      case 'stale': return 'Sem dados recentes';
      case 'never': return 'Nunca coletou';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'stale': return 'bg-yellow-100 text-yellow-800';
      case 'never': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando status das fontes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Status das Fontes</h2>
          <p className="text-slate-600 mt-1">
            Monitoramento em tempo real das suas fontes de dados
          </p>
        </div>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['recent-collections'] })}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources?.map((source) => {
          const status = getSourceStatus(source.name);
          return (
            <Card key={source.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{source.name}</CardTitle>
                  {getStatusIcon(status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {source.type}
                  </Badge>
                  <Badge className={getStatusColor(status)}>
                    {getStatusLabel(status)}
                  </Badge>
                  <Badge variant={source.active ? "default" : "secondary"}>
                    {source.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-600 truncate" title={source.url}>
                  {source.url}
                </p>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => testSourceMutation.mutate(source.id)}
                  disabled={testSourceMutation.isPending || !source.active}
                >
                  {testSourceMutation.isPending ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-2" />
                  )}
                  Testar Fonte
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!sources || sources.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nenhuma fonte configurada
            </h3>
            <p className="text-slate-500 mb-4">
              Configure suas fontes de dados para começar a coletar conteúdo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};