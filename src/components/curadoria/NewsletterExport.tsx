import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";
import { Copy, FileText, Calendar, ExternalLink, Filter, Sparkles, Loader2, Undo2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logBulk } from '@/lib/auditLog';
import { secureApi } from '@/lib/api';
import { useBranding } from '@/hooks/useBranding';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useQueryClient } from '@tanstack/react-query';
import { ContentStatus } from '@/types/content';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NewsletterExport = () => {
  const [generatedContent, setGeneratedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [editoriaFilter, setEditoriaFilter] = useState<string>('Todas');
  const [relevanciaFilter, setRelevanciaFilter] = useState<string>('Todas');
  const [isRefining, setIsRefining] = useState(false);
  const [lastRefinementTime, setLastRefinementTime] = useState<number>(0);
  const { brandingConfig } = useBranding();
  const { data: userSettings } = useUserSettings();
  const queryClient = useQueryClient();

  const { data: allItems, isLoading } = useQuery({
    queryKey: ['newsletter-approved-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('radar_brasis').select('*').eq('status', ContentStatus.FOR_NEWSLETTER).order('relevancia', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter(item => {
      const editoriaMatch = editoriaFilter === 'Todas' || item.editoria === editoriaFilter;
      const relevanciaMatch = relevanciaFilter === 'Todas' || item.relevancia.toString() === relevanciaFilter;
      return editoriaMatch && relevanciaMatch;
    });
  }, [allItems, editoriaFilter, relevanciaFilter]);

  const editorias = useMemo(() => {
    if (!allItems) return [];
    return [...new Set(allItems.map(item => item.editoria))].sort();
  }, [allItems]);

  const audienceSuggestions = useMemo(() => {
    return userSettings?.ai_example_audiences || [
      "Profissionais de RH em empresas de médio porte",
      "Executivos C-level, linguagem objetiva e estratégica",
      "Desenvolvedores e tech leads",
    ];
  }, [userSettings]);

  const generateNewsletterText = () => {
    if (!filteredItems || filteredItems.length === 0) {
      toast.error("Não há itens aprovados para gerar newsletter.");
      return;
    }
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    let content = `🎯 ${brandingConfig.companyName.toUpperCase()} - ${today}\n\n📍 ${brandingConfig.companyTagline}\n\nOlá! Aqui estão os destaques selecionados:\n\n`;

    const grouped = filteredItems.reduce((g, item) => {
      const ed = item.editoria || 'Geral';
      if (!g[ed]) g[ed] = [];
      g[ed].push(item);
      return g;
    }, {} as Record<string, typeof filteredItems>);

    Object.entries(grouped).forEach(([editoria, items]) => {
      content += `## ${editoria}\n\n`;
      items.forEach(item => {
        content += `**${item.title}**\n`;
        if (item.resumo_curado) content += `${item.resumo_curado}\n`;
        content += `📍 Fonte: ${item.source}\n`;
        if (item.link) content += `🔗 [Leia mais](${item.link})\n`;
        content += `\n---\n\n`;
      });
    });

    content += `${brandingConfig.newsletterFooter}\n\nAté a próxima edição!\n${brandingConfig.newsletterSignature}`;
    setGeneratedContent(content);
    setOriginalContent(content);
  };

  const refineWithAI = async () => {
    if (!generatedContent) { toast.error("Gere o texto primeiro."); return; }
    const now = Date.now();
    if (now - lastRefinementTime < 10000) { toast.error("Aguarde alguns segundos."); return; }

    setIsRefining(true);
    setLastRefinementTime(now);
    try {
      const data = await secureApi.invokeFunction('newsletter-editor', {
        newsletterText: generatedContent,
        publicoAlvo: publicoAlvo.trim() || null,
        customPrompt: null,
      });
      if (!data) throw new Error('Nenhum dado retornado');
      setGeneratedContent(data.refinedText);
      toast.success(`Newsletter refinada com ${data.promptUsed === 'saved' ? 'prompt personalizado' : 'prompt padrão'}`);
    } catch (error: any) {
      const isSession = error?.message?.includes('Authentication required') || error?.status === 403;
      toast.error(isSession ? "Sessão expirou. Faça login novamente." : "Não foi possível refinar. Tente novamente.");
    } finally {
      setIsRefining(false);
    }
  };

  const undoRefinement = () => {
    if (originalContent) { setGeneratedContent(originalContent); toast.success("Texto restaurado"); }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast.success("Newsletter copiada!");
    } catch { toast.error("Falha ao copiar."); }
  };

  const markAsPublished = async () => {
    if (!filteredItems || filteredItems.length === 0) return;
    if (!confirm(`Marcar ${filteredItems.length} itens como "Publicado"? Eles sairão da fila de newsletter.`)) return;
    try {
      const ids = filteredItems.map(i => i.id);
      const { error } = await supabase
        .from('radar_brasis')
        .update({ status: ContentStatus.PUBLISHED, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      await logBulk('marked_published', ids.length);
      toast.success(`${ids.length} itens marcados como Publicado.`);
      queryClient.invalidateQueries({ queryKey: ['newsletter-approved-items'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    } catch (e: any) {
      toast.error("Falha ao publicar itens: " + (e?.message || 'erro'));
    }
  };

  if (isLoading) return <div className="flex items-center justify-center p-8 text-muted-foreground">Carregando conteúdos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/curadoria" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Exportar Newsletter</h1>
            <p className="text-muted-foreground mt-1">Conteúdos aprovados prontos para newsletter</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">{filteredItems?.length || 0} de {allItems?.length || 0} itens</Badge>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Editoria</label>
              <Select value={editoriaFilter} onValueChange={setEditoriaFilter}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {editorias.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relevância</label>
              <Select value={relevanciaFilter} onValueChange={setRelevanciaFilter}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {[5,4,3,2,1].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Itens Aprovados</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {filteredItems && filteredItems.length > 0 ? filteredItems.map(item => (
              <div key={item.id} className="border-l-4 border-l-brasis-sage pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" /><span>{item.source}</span>
                      <Badge variant="outline" className="text-xs">{item.editoria}</Badge>
                      <Badge variant="secondary" className="text-xs">Relevância {item.relevancia}</Badge>
                    </div>
                    {item.resumo_curado && <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded">{item.resumo_curado}</p>}
                  </div>
                  {item.link && (
                    <Button size="sm" variant="outline" className="ml-2 flex-shrink-0" onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{allItems?.length === 0 ? "Nenhum item aprovado para newsletter. Vá à Aprovação e clique em \"Newsletter\" para enviar itens." : "Nenhum item corresponde aos filtros"}</p>
                {allItems?.length === 0 && (
                  <Button variant="outline" onClick={() => window.location.href = '/curadoria/approval'} className="mt-2">
                    ← Ir à Aprovação
                  </Button>
                )}
              </div>
            )}
            <Button onClick={generateNewsletterText} className="w-full" disabled={!filteredItems || filteredItems.length === 0}>
              <FileText className="h-4 w-4 mr-2" />Gerar Texto da Newsletter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Copy className="h-5 w-5" />Texto da Newsletter</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">🎯 Público-Alvo (opcional)</label>
              <Textarea value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)} placeholder="Ex: Profissionais de RH..." rows={3} className="text-sm" />
              {audienceSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
                  <div className="flex flex-wrap gap-1">
                    {audienceSuggestions.slice(0, 3).map((s, i) => (
                      <Button key={i} variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => setPublicoAlvo(s)}>
                        {s.split(',')[0]}...
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Textarea value={generatedContent} onChange={e => setGeneratedContent(e.target.value)} placeholder="Clique em 'Gerar Texto' para criar o conteúdo..." rows={16} className="font-mono text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button onClick={copyToClipboard} disabled={!generatedContent} variant="outline"><Copy className="h-4 w-4 mr-2" />Copiar</Button>
              <Button onClick={refineWithAI} disabled={!generatedContent || isRefining} className="bg-brasis-terracotta hover:bg-brasis-terracotta/90">
                {isRefining ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {isRefining ? 'Refinando...' : '🤖 Refinar com IA'}
              </Button>
            </div>
            {originalContent && originalContent !== generatedContent && (
              <Button onClick={undoRefinement} variant="ghost" size="sm" className="w-full text-muted-foreground">
                <Undo2 className="h-4 w-4 mr-2" />Desfazer refinamento
              </Button>
            )}
            <Button
              onClick={markAsPublished}
              disabled={!filteredItems || filteredItems.length === 0}
              variant="outline"
              className="w-full border-brasis-sage text-brasis-sage hover:bg-brasis-sage/10"
            >
              ✅ Marcar itens como Publicado ({filteredItems?.length || 0})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
