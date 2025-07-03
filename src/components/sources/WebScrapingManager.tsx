import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Globe, Loader2, Plus, Trash2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WebScrapingSource {
  id?: string;
  name: string;
  url: string;
  editoria: string;
  active: boolean;
}

export const WebScrapingManager = () => {
  const { toast } = useToast();
  const [sources, setSources] = useState<WebScrapingSource[]>([]);
  const [newSource, setNewSource] = useState<WebScrapingSource>({
    name: '',
    url: '',
    editoria: 'Geral',
    active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingUrl, setTestingUrl] = useState<string | null>(null);

  const editorias = [
    'Cultura', 'Social', 'Negócios', 'Sustentabilidade', 'Regional', 'Geral'
  ];

  const addSource = () => {
    if (newSource.name && newSource.url) {
      setSources([...sources, { ...newSource, id: Date.now().toString() }]);
      setNewSource({ name: '', url: '', editoria: 'Geral', active: true });
      
      toast({
        title: "✅ Site adicionado",
        description: `${newSource.name} foi adicionado para web scraping.`,
      });
    }
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(source => source.id !== id));
    toast({
      title: "Site removido",
      description: "Site foi removido da lista de scraping.",
    });
  };

  const testWebScraping = async (source: WebScrapingSource) => {
    setTestingUrl(source.url);
    
    try {
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: {
          url: source.url,
          sourceName: source.name,
          editoria: source.editoria
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Teste realizado",
          description: `${data.items_processed} itens processados, ${data.items_saved} salvos no radar.`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao fazer scraping do site.",
        variant: "destructive",
      });
    } finally {
      setTestingUrl(null);
    }
  };

  const runAllScraping = async () => {
    setIsLoading(true);
    let totalProcessed = 0;
    let totalSaved = 0;
    
    for (const source of sources.filter(s => s.active)) {
      try {
        const { data, error } = await supabase.functions.invoke('web-scraper', {
          body: {
            url: source.url,
            sourceName: source.name,
            editoria: source.editoria
          }
        });

        if (!error && data.success) {
          totalProcessed += data.items_processed;
          totalSaved += data.items_saved;
        }
      } catch (error) {
        console.error(`Erro ao fazer scraping de ${source.name}:`, error);
      }
    }
    
    setIsLoading(false);
    toast({
      title: "✅ Coleta concluída",
      description: `${totalProcessed} itens processados, ${totalSaved} novos salvos.`,
    });
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
                    <SelectItem key={editoria} value={editoria}>
                      {editoria}
                    </SelectItem>
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

      {sources.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sites Configurados ({sources.length})</CardTitle>
            <Button 
              onClick={runAllScraping} 
              disabled={isLoading || sources.filter(s => s.active).length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Coletar Todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{source.name}</h4>
                      <Badge variant="outline">{source.editoria}</Badge>
                      {!source.active && <Badge variant="secondary">Inativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{source.url}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebScraping(source)}
                      disabled={testingUrl === source.url}
                    >
                      {testingUrl === source.url ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSource(source.id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
                <li>• Extrai conteúdo de sites que não têm RSS feed</li>
                <li>• Analisa relevância automaticamente usando IA</li>
                <li>• Divide conteúdo longo em seções menores</li>
                <li>• Filtra apenas conteúdo relevante para o DNA Brasis</li>
                <li>• Salva diretamente no radar para curadoria</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};