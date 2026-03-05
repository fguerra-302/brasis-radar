
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, Globe, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useSharedSources } from '@/hooks/useSharedSources';
import { secureApi } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function SourcesStatus() {
  const { toast } = useToast();
  const { data: sources = [], isLoading } = useSharedSources();
  const queryClient = useQueryClient();

  const collectDataMutation = useMutation({
    mutationFn: async () => {
      const result = await secureApi.invokeFunction('radar-automation');
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Coleta Concluída",
        description: `${data.processedSources || 0} fontes processadas, ${data.savedItems || 0} novos itens coletados.`,
      });
      queryClient.invalidateQueries({ queryKey: ['shared-sources'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro na Coleta",
        description: error?.message || 'Falha ao coletar dados das fontes.',
        variant: "destructive",
      });
    },
  });

  const activeSources = sources.filter(s => s.active);
  const inactiveSources = sources.filter(s => !s.active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span>Carregando status das fontes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Status das Fontes</h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie suas fontes de dados (catálogo compartilhado)
          </p>
        </div>
        <Button 
          onClick={() => collectDataMutation.mutate()}
          disabled={collectDataMutation.isPending}
          className="gap-2"
        >
          {collectDataMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Coletar Dados Agora
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{sources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-semibold">{activeSources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Inativas</p>
                <p className="text-2xl font-semibold">{inactiveSources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">RSS</p>
                <p className="text-2xl font-semibold">
                  {sources.filter(s => s.type === 'RSS').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Fontes */}
      {sources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma fonte configurada</h3>
            <p className="text-muted-foreground mb-4">
              Configure suas primeiras fontes de dados para começar a coletar conteúdo.
            </p>
            <Button onClick={() => window.location.href = '/config/sources'}>
              Configurar Fontes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Fontes do Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${source.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{source.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {source.url}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {source.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {source.active ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
