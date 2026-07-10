import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';

const ACTION_LABEL: Record<string, string> = {
  approve: 'Aprovado',
  reject: 'Rejeitado',
  send_to_newsletter: 'Enviado à Newsletter',
  send_to_editor: 'Enviado à Edição',
  status_change: 'Status alterado',
  delete: 'Excluído',
  import_to_editor: 'Importado ao Editor',
};

const ACTION_COLOR: Record<string, string> = {
  approve: 'bg-primary/10 text-primary',
  reject: 'bg-destructive/10 text-destructive',
  send_to_newsletter: 'bg-accent/20 text-accent-foreground',
  send_to_editor: 'bg-secondary/20 text-secondary-foreground',
  status_change: 'bg-muted text-muted-foreground',
  delete: 'bg-destructive/10 text-destructive',
  import_to_editor: 'bg-primary/10 text-primary',
};

const Auditoria = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('todos');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('radar_audit_logs')
        .select('*, radar_brasis(title, source)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = (logs || []).filter((l) => {
    if (actionFilter !== 'todos' && l.action !== actionFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.radar_brasis?.title || '').toLowerCase().includes(q) ||
      (l.reason || '').toLowerCase().includes(q) ||
      (l.previous_status || '').toLowerCase().includes(q) ||
      (l.new_status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Logs de Auditoria</h1>
              <p className="text-sm text-muted-foreground">Rastreio de ações de curadoria — quem, quando, antes → depois</p>
            </div>
          </div>
          <Badge variant="secondary">{filtered.length} registros</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Input
              placeholder="Buscar por título, motivo, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="todos">Todas as ações</option>
              {Object.entries(ACTION_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {isLoading && <p className="text-muted-foreground">Carregando…</p>}

        <div className="space-y-2">
          {filtered.map((log) => (
            <Card key={log.id} className="border-l-4 border-l-primary/40">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={ACTION_COLOR[log.action] || 'bg-muted'}>
                        {ACTION_LABEL[log.action] || log.action}
                      </Badge>
                      {log.previous_status && (
                        <span className="text-xs text-muted-foreground">
                          <span className="line-through">{log.previous_status}</span>
                          {log.new_status && <> → <strong className="text-foreground">{log.new_status}</strong></>}
                        </span>
                      )}
                      {!log.previous_status && log.new_status && (
                        <span className="text-xs text-muted-foreground">→ <strong className="text-foreground">{log.new_status}</strong></span>
                      )}
                    </div>
                    <p className="font-medium text-foreground text-sm flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {log.radar_brasis?.title || log.metadata?.title || `Item ${log.item_id.substring(0, 8)}…`}
                    </p>
                    {log.reason && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Motivo: {log.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Usuário: <code className="font-mono">{log.user_id.substring(0, 8)}…</code>
                      {' · '}
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!isLoading && filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum registro encontrado.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auditoria;
