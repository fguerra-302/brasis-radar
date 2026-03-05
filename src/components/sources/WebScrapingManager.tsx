import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Globe, Loader2, Plus, Trash2, Play } from "lucide-react";
import { secureApi } from "@/lib/api";
import { validateUrl, sanitizeString } from "@/lib/inputValidation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const WebScrapingManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    editoria: 'Geral',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingUrl, setTestingUrl] = useState<string | null>(null);

  const editorias = [
    'Cultura', 'Social', 'Negócios', 'Sustentabilidade', 'Regional', 'Geral'
  ];

  // Load WEB sources from database
  const { data: sources = [], isLoading: loadingSources } = useQuery({
    queryKey: ['web-scraping-sources', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('radar_sources')
        .select('*')
        .eq('type', 'WEB')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addSource = async () => {
    if (!user) return;

    const urlValidation = validateUrl(newSource.url);
    if (!urlValidation.isValid) {
      toast({ title: "URL inválida", description: urlValidation.error, variant: "destructive" });
      return;
    }

    const sanitizedName = sanitizeString(newSource.name, 100);
    if (!sanitizedName) {
      toast({ title: "Nome inválido", description: "Digite um nome válido para o site.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('radar_sources').insert({
      name: sanitizedName,
      url: newSource.url.trim(),
      type: 'WEB',
      active: true,
      user_id: user.id,
      config: { editoria: newSource.editoria },
    });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    setNewSource({ name: '', url: '', editoria: 'Geral' });
    queryClient.invalidateQueries({ queryKey: ['web-scraping-sources'] });
    toast({ title: "✅ Site adicionado", description: `${sanitizedName} será coletado automaticamente.` });
  };

  const removeSource = async (id: string) => {
    const { error } = await supabase.from('radar_sources').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['web-scraping-sources'] });
    toast({ title: "Site removido" });
  };

  const toggleSource = async (id: string, active: boolean) => {
    await supabase.from('radar_sources').update({ active: !active }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['web-scraping-sources'] });
  };

  const testWebScraping = async (source: any) => {
    setTestingUrl(source.url);
    try {
      const editoria = (source.config as any)?.editoria || 'Geral';
      const data = await secureApi.invokeFunction('web-scraper', {
        url: source.url,
        sourceName: source.name,
        editoria,
      });
      if (data.success) {
        toast({
          title: "✅ Teste realizado",
          description: `${data.items_processed} itens processados, ${data.items_saved} salvos.`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: "Erro no teste", description: error.message || "Falha ao fazer scraping.", variant: "destructive" });
    } finally {
      setTestingUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Web Scraping (Sites sem RSS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="site-name">Nome do Site</Label>
              <Input
                id="site-name"
                placeholder="Ex: Portal da Cultura"
                value={newSource.name}
                onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="site-url">URL do Site</Label>
              <Input
                id="site-url"
                type="url"
                placeholder="https://example.com"
                value={newSource.url}
                onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="site-editoria">Editoria</Label>
              <Select
                value={newSource.editoria}
                onValueChange={(value) => setNewSource(prev => ({ ...prev, editoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a editoria" />
                </SelectTrigger>
                <SelectContent>
                  {editorias.map(editoria => (
                    <SelectItem key={editoria} value={editoria}>{editoria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addSource} disabled={!newSource.name || !newSource.url}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Site
          </Button>
        </CardContent>
      </Card>

      {loadingSources && <p className="text-sm text-muted-foreground">Carregando fontes...</p>}

      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sites Configurados ({sources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sources.map((source) => {
                const editoria = (source.config as any)?.editoria || 'Geral';
                return (
                  <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{source.name}</h4>
                        <Badge variant="outline">{editoria}</Badge>
                        {!source.active && <Badge variant="secondary">Inativo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{source.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleSource(source.id, !!source.active)}>
                        {source.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => testWebScraping(source)} disabled={testingUrl === source.url}>
                        {testingUrl === source.url ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => removeSource(source.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-semibold text-amber-900 mb-1">Como Funciona o Web Scraping</h3>
              <ul className="text-amber-800 space-y-1">
                <li>• Sites são coletados automaticamente junto com os feeds RSS</li>
                <li>• Extrai conteúdo de sites que não têm RSS feed</li>
                <li>• Analisa relevância automaticamente usando IA</li>
                <li>• Filtra apenas conteúdo relevante para suas editorias</li>
                <li>• Use o botão ▶ para testar a coleta manualmente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
