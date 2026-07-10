import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Database, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Meta = {
  mode?: 'cron' | 'manual';
  processedSources?: number;
  savedItems?: number;
  usersProcessed?: number;
  durationMs?: number;
  error?: string;
};

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return new Date(iso).toLocaleString('pt-BR');
};

export const LastAutomationRun = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['last-automation-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_audit_logs' as any)
        .select('id, created_at, metadata, reason')
        .eq('action', 'automated_collection')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { id: string; created_at: string; metadata: Meta; reason: string | null } | null;
    },
    refetchInterval: 60000,
  });

  const meta = (data?.metadata ?? {}) as Meta;
  const hasError = !!meta.error || !!data?.reason;
  const success = !!data && !hasError;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Última execução
          </CardTitle>
          {data && (
            <Badge
              variant={success ? 'default' : 'destructive'}
              className={success ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : ''}
            >
              {success ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Sucesso</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Erro</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm font-sans">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !data ? (
          <p className="text-muted-foreground">Nenhuma execução registrada ainda.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatRelative(data.created_at)}</span>
              <span className="text-muted-foreground text-xs">
                · {new Date(data.created_at).toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-2">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Database className="h-3 w-3" /> Itens coletados
                </div>
                <p className="text-lg font-semibold text-foreground">{meta.savedItems ?? 0}</p>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground text-xs">Fontes processadas</div>
                <p className="text-lg font-semibold text-foreground">{meta.processedSources ?? 0}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                {meta.mode === 'cron' ? 'Cron automático' : meta.mode === 'manual' ? 'Manual' : 'Execução'}
              </Badge>
              {typeof meta.usersProcessed === 'number' && (
                <Badge variant="outline">{meta.usersProcessed} usuário(s)</Badge>
              )}
              {typeof meta.durationMs === 'number' && (
                <Badge variant="outline">{(meta.durationMs / 1000).toFixed(1)}s</Badge>
              )}
            </div>

            {hasError && (
              <p className="text-xs text-destructive break-words">
                {meta.error || data.reason}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LastAutomationRun;
