import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, RotateCcw, Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEditorialWeights, useUpsertEditorialWeight, useDeleteEditorialWeight } from '@/hooks/useEditorialWeights';
import { useUserSettings } from '@/hooks/useUserSettings';

interface EditoriaWeightUI {
  id?: string;
  name: string;
  color: string;
  multiplier: number;
  description: string;
}

const defaultWeights: EditoriaWeightUI[] = [
  {
    name: 'Cultura',
    color: 'bg-purple-100 text-purple-800',
    multiplier: 1.4,
    description: 'Arte, música, literatura, cinema, festivais'
  },
  {
    name: 'Social',
    color: 'bg-blue-100 text-blue-800',
    multiplier: 1.5,
    description: 'Educação, saúde, direitos, comunidade'
  },
  {
    name: 'Negócios',
    color: 'bg-green-100 text-green-800',
    multiplier: 1.3,
    description: 'Economia, startups, investimentos, mercado'
  },
  {
    name: 'Sustentabilidade',
    color: 'bg-emerald-100 text-emerald-800',
    multiplier: 1.6,
    description: 'Meio ambiente, energia limpa, ESG'
  },
  {
    name: 'Regional',
    color: 'bg-orange-100 text-orange-800',
    multiplier: 1.3,
    description: 'Notícias regionais e locais'
  },
  {
    name: 'Geral',
    color: 'bg-gray-100 text-gray-800',
    multiplier: 1.0,
    description: 'Outras categorias e temas diversos'
  }
];

const colorOptions = [
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800', 
  'bg-green-100 text-green-800',
  'bg-emerald-100 text-emerald-800',
  'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800'
];

export const EditoriaWeights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Backend data
  const { data: editorialWeights, isLoading } = useEditorialWeights();
  const { data: userSettings } = useUserSettings();
  const upsertWeight = useUpsertEditorialWeight();
  const deleteWeight = useDeleteEditorialWeight();
  
  // UI state
  const [weights, setWeights] = useState<EditoriaWeightUI[]>([]);
  const [minThreshold, setMinThreshold] = useState(3);
  const [hasChanges, setHasChanges] = useState(false);
  const [newEditoria, setNewEditoria] = useState({ name: '', description: '' });
  
  // Sync backend data with UI state
  useEffect(() => {
    if (editorialWeights) {
      // Convert backend data to UI format
      const uiWeights: EditoriaWeightUI[] = editorialWeights.map(weight => ({
        id: weight.id,
        name: weight.editoria,
        color: colorOptions[editorialWeights.indexOf(weight) % colorOptions.length],
        multiplier: Number(weight.multiplier),
        description: getDescriptionForEditoria(weight.editoria)
      }));
      
      // Add any missing default weights
      const existingEditorias = uiWeights.map(w => w.name);
      const missingDefaults = defaultWeights.filter(dw => !existingEditorias.includes(dw.name));
      
      setWeights([...uiWeights, ...missingDefaults]);
    } else if (!isLoading) {
      setWeights(defaultWeights);
    }
  }, [editorialWeights, isLoading]);
  
  // For now, min_relevance_threshold will be added to user_settings later
  // useEffect(() => {
  //   if (userSettings?.min_relevance_threshold) {
  //     setMinThreshold(userSettings.min_relevance_threshold);
  //   }
  // }, [userSettings]);
  
  const getDescriptionForEditoria = (editoria: string): string => {
    const defaultWeight = defaultWeights.find(dw => dw.name === editoria);
    return defaultWeight?.description || 'Categoria personalizada';
  };

  const updateWeight = (index: number, newMultiplier: number) => {
    const updatedWeights = [...weights];
    updatedWeights[index].multiplier = newMultiplier;
    setWeights(updatedWeights);
    setHasChanges(true);
  };

  const addEditoria = () => {
    if (newEditoria.name.trim() && newEditoria.description.trim()) {
      const newColor = colorOptions[weights.length % colorOptions.length];
      
      const newEditoriaObj: EditoriaWeightUI = {
        name: newEditoria.name.trim(),
        description: newEditoria.description.trim(),
        multiplier: 1.0,
        color: newColor
      };
      
      setWeights([...weights, newEditoriaObj]);
      setNewEditoria({ name: '', description: '' });
      setHasChanges(true);
      
      toast({
        title: "✅ Editoria adicionada",
        description: `${newEditoria.name} foi adicionada com sucesso.`,
      });
    }
  };

  const removeEditoria = async (index: number) => {
    const weight = weights[index];
    
    if (weight.id) {
      // Delete from backend
      try {
        await deleteWeight.mutateAsync(weight.id);
      } catch (error) {
        return; // Error already shown by hook
      }
    }
    
    // Remove from UI
    const updatedWeights = weights.filter((_, i) => i !== index);
    setWeights(updatedWeights);
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setWeights(defaultWeights);
    setMinThreshold(3);
    setHasChanges(true);
    toast({
      title: "Configurações restauradas",
      description: "Os multiplicadores e threshold foram restaurados para os valores padrão.",
    });
  };

  const saveWeights = async () => {
    try {
      // Save editorial weights
      for (const weight of weights) {
        await upsertWeight.mutateAsync({
          editoria: weight.name,
          multiplier: weight.multiplier
        });
      }
      
      // Update min threshold in user settings (if available)
      // This would require extending useUserSettings to update threshold
      
      toast({
        title: "✅ Configurações salvas",
        description: "Os multiplicadores editoriais foram atualizados com sucesso.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  const getMultiplierLabel = (multiplier: number) => {
    if (multiplier >= 1.8) return "Prioridade Máxima";
    if (multiplier >= 1.5) return "Alta Prioridade";
    if (multiplier >= 1.2) return "Prioridade Média";
    if (multiplier >= 0.8) return "Prioridade Normal";
    return "Baixa Prioridade";
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 1.8) return "bg-red-100 text-red-800";
    if (multiplier >= 1.5) return "bg-orange-100 text-orange-800";
    if (multiplier >= 1.2) return "bg-yellow-100 text-yellow-800";
    if (multiplier >= 0.8) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Multiplicadores por Editoria</h1>
          <p className="text-slate-600 mt-1">
            Configure os multiplicadores que cada editoria terá no cálculo de relevância
          </p>
        </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrões
          </Button>
        </div>
      </div>

      {/* Threshold Configuration */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <TrendingUp className="h-5 w-5" />
            Relevância Mínima para Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700 min-w-0">
              Threshold: {minThreshold}
            </label>
            <Slider
              value={[minThreshold]}
              onValueChange={(value) => {
                setMinThreshold(value[0]);
                setHasChanges(true);
              }}
              max={5}
              min={1}
              step={1}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-slate-600">
            Apenas itens com nota final ≥ {minThreshold} serão inseridos no banco. 
            Nota final = Pontos das Palavras-Chave × Multiplicador da Editoria
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weights.map((editoria, index) => (
          <Card key={editoria.name} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Badge className={editoria.color}>
                    {editoria.name}
                  </Badge>
                  <span className="text-2xl font-bold text-slate-800">
                    {editoria.multiplier.toFixed(1)}x
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getMultiplierColor(editoria.multiplier)}>
                    {getMultiplierLabel(editoria.multiplier)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeEditoria(index)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {editoria.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Slider
                  value={[editoria.multiplier]}
                  onValueChange={(value) => updateWeight(index, value[0])}
                  max={2.0}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0.5x (Mínimo)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Máximo)</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                <strong>Como funciona:</strong> A pontuação das palavras-chave será multiplicada por {editoria.multiplier.toFixed(1)}.
                Ex: Se uma notícia de {editoria.name} tem 2 pontos, a nota final será {(2 * editoria.multiplier).toFixed(1)}.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Adicionar Nova Editoria */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Plus className="h-5 w-5" />
            Adicionar Nova Editoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-green-700 mb-2 block">
                Nome da Editoria
              </label>
              <Input
                placeholder="Ex: Tecnologia"
                value={newEditoria.name}
                onChange={(e) => setNewEditoria(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-green-700 mb-2 block">
                Descrição
              </label>
              <Input
                placeholder="Ex: Inovação, startups, gadgets"
                value={newEditoria.description}
                onChange={(e) => setNewEditoria(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <Button 
            onClick={addEditoria}
            disabled={!newEditoria.name.trim() || !newEditoria.description.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Editoria
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Como os Multiplicadores Funcionam</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>2.0x:</strong> Dobra a pontuação - prioridade máxima</li>
                <li>• <strong>1.5x:</strong> Aumenta 50% - alta prioridade</li>
                <li>• <strong>1.0x:</strong> Sem alteração - prioridade normal</li>
                <li>• <strong>0.7x:</strong> Reduz 30% - baixa prioridade</li>
                <li>• <strong>0.5x:</strong> Corta pela metade - prioridade mínima</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                <strong>Fórmula:</strong> Nota Final = Pontos das Palavras-Chave × Multiplicador da Editoria
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setHasChanges(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={saveWeights} 
            disabled={upsertWeight.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {upsertWeight.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      )}
    </div>
  );
};