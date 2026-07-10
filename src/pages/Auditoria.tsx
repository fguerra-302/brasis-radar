import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Search, FileText, CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

const PAGE_SIZE = 25;

const Auditoria = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('todos');
  const [sourceFilter, setSourceFilter] = useState<string>('todos');
  const [editoriaFilter, setEditoriaFilter] = useState<string>('todos');
  const [itemIdFilter, setItemIdFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, actionFilter, sourceFilter, editoriaFilter, itemIdFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      const needInner = sourceFilter !== 'todos' || editoriaFilter !== 'todos';
      const rel = needInner ? 'radar_brasis!inner(title, source, editoria)' : 'radar_brasis(title, source, editoria)';
      let q = (supabase as any)
        .from('radar_audit_logs')
        .select(`*, ${rel}`, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (actionFilter !== 'todos') q = q.eq('action', actionFilter);
      if (itemIdFilter.trim()) q = q.eq('item_id', itemIdFilter.trim());
      if (dateFrom) q = q.gte('created_at', dateFrom.toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        q = q.lte('created_at', end.toISOString());
      }
      if (sourceFilter !== 'todos') q = q.eq('radar_brasis.source', sourceFilter);
      if (editoriaFilter !== 'todos') q = q.eq('radar_brasis.editoria', editoriaFilter);
      if (search.trim()) q = q.or(`reason.ilike.%${search}%,previous_status.ilike.%${search}%,new_status.ilike.%${search}%`);

      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data || []) as any[], count: count || 0 };
    },
  });

  // Fetch distinct sources/editorias once from radar_brasis for the whole dataset
  const { data: filterOptions } = useQuery({
    queryKey: ['audit-filter-options'],
    queryFn: async () => {
      const { data } = await supabase.from('radar_brasis').select('source, editoria').limit(1000);
      const s = new Set<string>();
      const e = new Set<string>();
      data?.forEach((r: any) => {
        if (r.source) s.add(r.source);
        if (r.editoria) e.add(r.editoria);
      });
      return { sources: Array.from(s).sort(), editorias: Array.from(e).sort() };
    },
    staleTime: 5 * 60 * 1000,
  });

  const logs = data?.rows || [];
  const total = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sources = filterOptions?.sources || [];
  const editorias = filterOptions?.editorias || [];
  const filtered = logs;


  const clearFilters = () => {
    setSearch(''); setActionFilter('todos'); setSourceFilter('todos');
    setEditoriaFilter('todos'); setItemIdFilter(''); setDateFrom(undefined); setDateTo(undefined);
    setPage(0);
  };

  const hasActiveFilters = search || actionFilter !== 'todos' || sourceFilter !== 'todos' ||
    editoriaFilter !== 'todos' || itemIdFilter || dateFrom || dateTo;

  // Reset page when filters change
  const resetAndSet = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0); };

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
          <Badge variant="secondary">{total} registros no total</Badge>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Limpar filtros
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input
                placeholder="Buscar por título, motivo, status…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
              <Input
                placeholder="ID exato do item (UUID)"
                value={itemIdFilter}
                onChange={(e) => { setItemIdFilter(e.target.value); setPage(0); }}
              />
              <select
                value={actionFilter}
                onChange={(e) => resetAndSet(setActionFilter)(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="todos">Todas as ações</option>
                {Object.entries(ACTION_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => resetAndSet(setSourceFilter)(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="todos">Todas as fontes</option>
                {sources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={editoriaFilter}
                onChange={(e) => resetAndSet(setEditoriaFilter)(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="todos">Todas as editorias</option>
                {editorias.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateFrom ? format(dateFrom, "dd/MM/yy", { locale: ptBR }) : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setPage(0); }} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateTo ? format(dateTo, "dd/MM/yy", { locale: ptBR }) : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setPage(0); }} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
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
                      {log.radar_brasis?.source && (
                        <Badge variant="outline" className="text-xs">{log.radar_brasis.source}</Badge>
                      )}
                      {log.radar_brasis?.editoria && (
                        <Badge variant="outline" className="text-xs">{log.radar_brasis.editoria}</Badge>
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
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
                      <span>Usuário: <code className="font-mono">{log.user_id.substring(0, 8)}…</code></span>
                      <span>·</span>
                      <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                      <span>·</span>
                      <button
                        className="underline hover:text-foreground"
                        onClick={() => { setItemIdFilter(log.item_id); setPage(0); }}
                        title="Filtrar por este item"
                      >
                        item: {log.item_id.substring(0, 8)}…
                      </button>
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

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages} · mostrando {logs.length} de {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auditoria;
