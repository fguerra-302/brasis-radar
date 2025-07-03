import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Target, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRadarKeywords, useUpdateRadarKeyword } from '@/hooks/useRadarConfig';

export const KeywordsConfig = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [newKeyword, setNewKeyword] = useState('');
  const { toast } = useToast();
  
  const { data: keywordCategories = [], isLoading } = useRadarKeywords();
  const updateKeywordMutation = useUpdateRadarKeyword();

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
        setIsAddDialogOpen(false);
        toast({
          title: "✅ Palavra-chave adicionada",
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

  const removeKeyword = async (category: any, keywordIndex: number) => {
    const keyword = category.keywords[keywordIndex];
    if (!confirm(`Remover a palavra-chave "${keyword}"?`)) return;
    
    const updatedKeywords = category.keywords.filter((_: any, index: number) => index !== keywordIndex);
    
    try {
      await updateKeywordMutation.mutateAsync({
        id: category.id,
        payload: { keywords: updatedKeywords }
      });
      toast({
        title: "✅ Palavra-chave removida",
        description: `"${keyword}" foi removida da categoria ${category.category_name}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover palavra-chave.",
        variant: "destructive",
      });
    }
  };

  const updateWeight = async (category: any, weight: number) => {
    try {
      await updateKeywordMutation.mutateAsync({
        id: category.id,
        payload: { weight }
      });
      toast({
        title: "✅ Peso atualizado",
        description: `Peso da categoria ${category.category_name} foi atualizado.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar peso.",
        variant: "destructive",
      });
    }
  };

  const getWeightColor = (weight: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-yellow-100 text-yellow-800', 
      3: 'bg-red-100 text-red-800'
    };
    return colors[weight] || 'bg-gray-100 text-gray-800';
  };

  const getWeightLabel = (weight: number) => {
    const labels = { 1: 'Baixa', 2: 'Média', 3: 'Alta' };
    return labels[weight] || 'Indefinida';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando categorias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Palavras-chave</h1>
          <p className="text-slate-600 mt-1">
            Configure categorias e suas palavras-chave para análise de relevância
          </p>
        </div>
        
        {keywordCategories.length > 0 && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
                Adicionar Palavra-chave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Palavra-chave</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={selectedCategory.toString()}
                    onValueChange={(value) => setSelectedCategory(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {keywordCategories.map((category, index) => (
                        <SelectItem key={category.id} value={index.toString()}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="keyword">Nova Palavra-chave</Label>
                  <Input
                    id="keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Digite a palavra-chave"
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {keywordCategories.map((category) => (
          <Card key={category.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">{category.category_name}</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getWeightColor(category.weight)}>
                    Relevância {getWeightLabel(category.weight)}
                  </Badge>
                  <Select
                    value={category.weight.toString()}
                    onValueChange={(value) => updateWeight(category, parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Peso 1 (Baixa)</SelectItem>
                      <SelectItem value="2">Peso 2 (Média)</SelectItem>
                      <SelectItem value="3">Peso 3 (Alta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {category.keywords.map((keyword, keywordIndex) => (
                  <Badge 
                    key={keywordIndex} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(category, keywordIndex)}
                      className="ml-1 hover:text-red-500 transition-colors"
                      disabled={updateKeywordMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {category.keywords.length === 0 && (
                  <p className="text-slate-500 text-sm">Nenhuma palavra-chave configurada</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!keywordCategories || keywordCategories.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nenhuma categoria configurada
            </h3>
            <p className="text-slate-500 mb-4">
              As categorias de palavras-chave são criadas automaticamente pelo sistema
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};