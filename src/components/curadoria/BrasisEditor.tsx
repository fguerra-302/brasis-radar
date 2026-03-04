import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lightbulb, Eye, Compass, Target, Plus, X, BookOpen, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BrasisContentPreview } from "./BrasisContentPreview";
import { BrasisLibrary } from "./BrasisLibrary";

interface ContentState {
  title: string;
  observation: string;
  reflection: string;
  example: string;
  tip: string;
  tags: string[];
}

const emptyContent: ContentState = {
  title: '', observation: '', reflection: '', example: '', tip: '', tags: []
};

export const BrasisEditor = () => {
  const [content, setContent] = useState<ContentState>(emptyContent);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<string>("editor");
  const [importOpen, setImportOpen] = useState(false);

  // Buscar itens do radar disponíveis para importar
  const { data: radarItems, isLoading: loadingRadar } = useQuery({
    queryKey: ['radar-import-items'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('id, title, resumo_curado, source, tags, editoria, status')
        .eq('user_id', user.id)
        .in('status', ['Em aprovação', 'Para Newsletter'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: importOpen,
  });

  const handleChange = (field: keyof ContentState, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !content.tags.includes(trimmed)) {
      setContent(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setContent(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleImportFromRadar = (item: any) => {
    setContent(prev => ({
      ...prev,
      title: item.title || prev.title,
      observation: item.resumo_curado || item.title || '',
      tags: item.tags?.length > 0 ? [...new Set([...prev.tags, ...item.tags])] : prev.tags,
    }));
    setImportOpen(false);
    toast.success(`"${item.title?.substring(0, 40)}..." importado para o editor`);
  };

  const handleSave = async () => {
    if (!content.title || !content.observation) {
      toast.error("Título e observação são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login primeiro"); return; }

      const { error } = await supabase.from('brasis_content').insert({
        user_id: user.id,
        title: content.title,
        observation: content.observation,
        reflection: content.reflection || null,
        example: content.example || null,
        tip: content.tip || null,
        tags: content.tags,
      });

      if (error) throw error;
      toast.success("Conteúdo salvo!");
      setContent(emptyContent);
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Editor Brasis</h1>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />Importar do Radar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importar do Radar</DialogTitle>
              <p className="text-sm text-muted-foreground">Selecione um item para pré-preencher o editor</p>
            </DialogHeader>
            {loadingRadar ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : radarItems && radarItems.length > 0 ? (
              <div className="space-y-2">
                {radarItems.map((item) => (
                  <div key={item.id}
                    className="p-3 border rounded-lg hover:border-brasis-terracotta/50 cursor-pointer transition-colors"
                    onClick={() => handleImportFromRadar(item)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-foreground leading-tight">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{item.editoria}</Badge>
                          <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                          <span className="text-xs text-muted-foreground">{item.source}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum item disponível para importar</p>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="editor"><Lightbulb className="h-4 w-4 mr-1.5" />Editor</TabsTrigger>
          <TabsTrigger value="library"><BookOpen className="h-4 w-4 mr-1.5" />Biblioteca</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Side */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-brasis-terracotta" />
                    Título & Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Título do conteúdo</Label>
                    <Input value={content.title} onChange={e => handleChange('title', e.target.value)} placeholder="Um título marcante..." />
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {content.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                    <Input placeholder="Pressione Enter para adicionar tag..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-brasis-terracotta" />1. Observação Inesperada
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Algo cotidiano, mas que nunca paramos para notar</p>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Descreva algo que surpreende no cotidiano..." value={content.observation}
                    onChange={e => handleChange('observation', e.target.value)} className="min-h-24" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Compass className="w-4 h-4 text-brasis-terracotta" />2. Reflexão Cultural
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Analogias e provocações leves sobre o comportamento</p>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Desenvolva a reflexão com analogias interessantes..." value={content.reflection}
                    onChange={e => handleChange('reflection', e.target.value)} className="min-h-28" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-brasis-sage" />3. Exemplo Real
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Marca, prática ou pessoa fora do eixo comum</p>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Um exemplo concreto que ilustra o ponto..." value={content.example}
                    onChange={e => handleChange('example', e.target.value)} className="min-h-28" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-4 h-4 text-brasis-sage" />4. Dica ou Provocação
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">O fechamento elegante e prático</p>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Uma provocação elegante ou dica prática..." value={content.tip}
                    onChange={e => handleChange('tip', e.target.value)} className="min-h-24" />
                </CardContent>
              </Card>

              <Button onClick={handleSave} disabled={saving} size="lg"
                className="w-full bg-brasis-terracotta hover:bg-brasis-terracotta/90 text-brasis-terracotta-foreground">
                {saving ? "Salvando..." : "Salvar Conteúdo"}
              </Button>
            </div>

            {/* Preview Side */}
            <div className="hidden lg:block sticky top-4 self-start">
              <BrasisContentPreview content={content} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <BrasisLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
};
