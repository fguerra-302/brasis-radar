
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Settings, Save, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
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
          <Settings className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-800">Configuração do Radar</h1>
        </div>
        <p className="text-slate-600">Configure suas fontes e palavras-chave para uma curadoria mais efetiva</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fontes de Notícias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">📰 Fontes de Notícias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de fontes */}
            <div className="space-y-2">
              {sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{source.name}</div>
                    <div className="text-sm text-slate-500 truncate">{source.url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={source.active ? "default" : "outline"}
                      onClick={() => toggleSource(source)}
                      disabled={updateSourceMutation.isPending}
                    >
                      {source.active ? "Ativa" : "Inativa"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSource(source.id)}
                      disabled={deleteSourceMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar nova fonte */}
            <div className="space-y-2 pt-4 border-t">
              <Input
                placeholder="Nome da fonte (ex: G1 Bahia)"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              />
              <Input
                placeholder="URL do RSS (ex: https://g1.globo.com/rss/...)"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              />
              <Button 
                onClick={addSource} 
                className="w-full" 
                disabled={createSourceMutation.isPending}
              >
                {createSourceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Adicionar Fonte
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Palavras-chave */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">🎯 Palavras-chave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {keywordCategories.map((category, categoryIndex) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-700">{category.category_name}</h3>
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
      </div>
    </div>
  );
};

export default RadarConfig;
