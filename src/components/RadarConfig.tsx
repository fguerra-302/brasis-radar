
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Settings, Save, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useRadarSources,
  useRadarKeywords,
  useCreateRadarSource,
  useUpdateRadarSource,
  useDeleteRadarSource,
  useUpdateRadarKeyword,
  NewsSource,
  KeywordCategory
} from '@/hooks/useRadarConfig';
import SourceManager from './sources/SourceManager';
import { WebScrapingManager } from './sources/WebScrapingManager';

const RadarConfig = () => {
  const { toast } = useToast();
  
  const { data: sources = [], isLoading: sourcesLoading } = useRadarSources();
  const { data: keywordCategories = [], isLoading: keywordsLoading } = useRadarKeywords();
  
  const createSourceMutation = useCreateRadarSource();
  const updateSourceMutation = useUpdateRadarSource();
  const deleteSourceMutation = useDeleteRadarSource();
  const updateKeywordMutation = useUpdateRadarKeyword();

  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);

  const addSource = async () => {
    if (newSource.name && newSource.url) {
      try {
        await createSourceMutation.mutateAsync({
          name: newSource.name,
          url: newSource.url,
          type: 'RSS',
          active: true
        });
        setNewSource({ name: '', url: '' });
        toast({
          title: "✅ Fonte Adicionada",
          description: `${newSource.name} foi adicionada às suas fontes.`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao adicionar fonte.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleSource = async (source: NewsSource) => {
    try {
      await updateSourceMutation.mutateAsync({
        id: source.id,
        payload: { active: !source.active }
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar fonte.",
        variant: "destructive",
      });
    }
  };

  const removeSource = async (id: string) => {
    try {
      await deleteSourceMutation.mutateAsync(id);
      toast({
        title: "✅ Fonte Removida",
        description: "Fonte foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover fonte.",
        variant: "destructive",
      });
    }
  };

  const addKeyword = async () => {
    if (newKeyword.trim() && keywordCategories[selectedCategory]) {
      const category = keywordCategories[selectedCategory];
      const updatedKeywords = [...category.keywords, newKeyword.trim().toLowerCase()];
      
      try {
        await updateKeywordMutation.mutateAsync({
          id: category.id,
          payload: { keywords: updatedKeywords }
        });
        setNewKeyword('');
        toast({
          title: "✅ Palavra-chave Adicionada",
          description: `"${newKeyword}" foi adicionada à categoria ${category.category_name}.`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao adicionar palavra-chave.",
          variant: "destructive",
        });
      }
    }
  };

  const removeKeyword = async (category: KeywordCategory, keywordIndex: number) => {
    const updatedKeywords = category.keywords.filter((_, index) => index !== keywordIndex);
    
    try {
      await updateKeywordMutation.mutateAsync({
        id: category.id,
        payload: { keywords: updatedKeywords }
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover palavra-chave.",
        variant: "destructive",
      });
    }
  };

  const updateWeight = async (category: KeywordCategory, weight: number) => {
    try {
      await updateKeywordMutation.mutateAsync({
        id: category.id,
        payload: { weight }
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar peso.",
        variant: "destructive",
      });
    }
  };

  if (sourcesLoading || keywordsLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-800">Carregando Configuração...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Configuração do Radar</h1>
        </div>
        <p className="text-muted-foreground">Configure suas fontes e palavras-chave para uma curadoria mais efetiva</p>
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources">Fontes RSS</TabsTrigger>
          <TabsTrigger value="scraping">Web Scraping</TabsTrigger>
          <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <SourceManager />
        </TabsContent>

        <TabsContent value="scraping">
          <WebScrapingManager />
        </TabsContent>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">🎯 Palavras-chave por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {keywordCategories.map((category, categoryIndex) => (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{category.category_name}</h3>
                    <select
                      value={category.weight}
                      onChange={(e) => updateWeight(category, parseInt(e.target.value))}
                      className="text-sm border rounded px-2 py-1"
                      disabled={updateKeywordMutation.isPending}
                    >
                      <option value={1}>Peso 1</option>
                      <option value={2}>Peso 2</option>
                      <option value={3}>Peso 3</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {category.keywords.map((keyword, keywordIndex) => (
                      <Badge key={keywordIndex} variant="secondary" className="flex items-center gap-1">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(category, keywordIndex)}
                          className="ml-1 hover:text-red-500"
                          disabled={updateKeywordMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}

              {/* Adicionar nova palavra-chave */}
              {keywordCategories.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {keywordCategories.map((category, index) => (
                      <option key={category.id} value={index}>{category.category_name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova palavra-chave"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button 
                      onClick={addKeyword} 
                      disabled={updateKeywordMutation.isPending}
                    >
                      {updateKeywordMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RadarConfig;
