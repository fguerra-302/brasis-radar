import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, RotateCcw, Plus, Trash2 } from "lucide-react";

interface EditoriaWeight {
  name: string;
  color: string;
  weight: number;
  description: string;
}

const defaultWeights: EditoriaWeight[] = [
  {
    name: 'Cultura',
    color: 'bg-purple-100 text-purple-800',
    weight: 85,
    description: 'Arte, música, literatura, cinema, festivais'
  },
  {
    name: 'Social',
    color: 'bg-blue-100 text-blue-800',
    weight: 90,
    description: 'Educação, saúde, direitos, comunidade'
  },
  {
    name: 'Negócios',
    color: 'bg-green-100 text-green-800',
    weight: 75,
    description: 'Economia, startups, investimentos, mercado'
  },
  {
    name: 'Sustentabilidade',
    color: 'bg-emerald-100 text-emerald-800',
    weight: 95,
    description: 'Meio ambiente, energia limpa, ESG'
  },
  {
    name: 'Regional',
    color: 'bg-orange-100 text-orange-800',
    weight: 80,
    description: 'Notícias regionais e locais'
  },
  {
    name: 'Geral',
    color: 'bg-gray-100 text-gray-800',
    weight: 60,
    description: 'Outras categorias e temas diversos'
  }
];

export const EditoriaWeights = () => {
  const [weights, setWeights] = useState<EditoriaWeight[]>(defaultWeights);
  const [hasChanges, setHasChanges] = useState(false);
  const [newEditoria, setNewEditoria] = useState({ name: '', description: '' });
  const { toast } = useToast();

  const updateWeight = (index: number, newWeight: number) => {
    const updatedWeights = [...weights];
    updatedWeights[index].weight = newWeight;
    setWeights(updatedWeights);
    setHasChanges(true);
  };

  const addEditoria = () => {
    if (newEditoria.name.trim() && newEditoria.description.trim()) {
      const colors = [
        'bg-purple-100 text-purple-800',
        'bg-blue-100 text-blue-800', 
        'bg-green-100 text-green-800',
        'bg-emerald-100 text-emerald-800',
        'bg-orange-100 text-orange-800',
        'bg-red-100 text-red-800',
        'bg-yellow-100 text-yellow-800',
        'bg-indigo-100 text-indigo-800'
      ];
      
      const newColor = colors[weights.length % colors.length];
      
      const newEditoriaObj: EditoriaWeight = {
        name: newEditoria.name.trim(),
        description: newEditoria.description.trim(),
        weight: 70,
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

  const removeEditoria = (index: number) => {
    const editoriaName = weights[index].name;
    const updatedWeights = weights.filter((_, i) => i !== index);
    setWeights(updatedWeights);
    setHasChanges(true);
    
    toast({
      title: "Editoria removida",
      description: `${editoriaName} foi removida.`,
    });
  };

  const resetToDefaults = () => {
    setWeights(defaultWeights);
    setHasChanges(true);
    toast({
      title: "Pesos restaurados",
      description: "Os pesos foram restaurados para os valores padrão.",
    });
  };

  const saveWeights = async () => {
    try {
      // Aqui você salvaria no Supabase
      console.log('Salvando pesos:', weights);
      
      toast({
        title: "✅ Pesos salvos",
        description: "Os pesos por editoria foram atualizados com sucesso.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar os pesos das editorias.",
        variant: "destructive",
      });
    }
  };

  const getWeightLabel = (weight: number) => {
    if (weight >= 90) return "Prioridade Máxima";
    if (weight >= 80) return "Alta Prioridade";
    if (weight >= 70) return "Prioridade Média";
    if (weight >= 60) return "Baixa Prioridade";
    return "Prioridade Mínima";
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 90) return "bg-red-100 text-red-800";
    if (weight >= 80) return "bg-orange-100 text-orange-800";
    if (weight >= 70) return "bg-yellow-100 text-yellow-800";
    if (weight >= 60) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pesos por Editoria</h1>
          <p className="text-slate-600 mt-1">
            Configure a prioridade que cada editoria terá na curadoria automática
          </p>
        </div>
        <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrões
        </Button>
      </div>

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
                    {editoria.weight}%
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getWeightColor(editoria.weight)}>
                    {getWeightLabel(editoria.weight)}
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
                  value={[editoria.weight]}
                  onValueChange={(value) => updateWeight(index, value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0% (Ignorar)</span>
                  <span>50% (Neutral)</span>
                  <span>100% (Máxima)</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                <strong>Como funciona:</strong> Notícias desta editoria com peso maior 
                terão prioridade na curadoria e aparecerão com maior relevância.
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
              <h3 className="font-semibold text-blue-900 mb-2">Como os Pesos Funcionam</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>90-100%:</strong> Notícias desta editoria sempre aparecem no topo</li>
                <li>• <strong>80-89%:</strong> Alta prioridade, aprovação quase automática</li>
                <li>• <strong>70-79%:</strong> Prioridade média, precisa revisão manual</li>
                <li>• <strong>60-69%:</strong> Baixa prioridade, filtros mais rigorosos</li>
                <li>• <strong>0-59%:</strong> Prioridade mínima, raramente aparece</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setHasChanges(false)}>
            Cancelar
          </Button>
          <Button onClick={saveWeights} className="bg-indigo-600 hover:bg-indigo-700">
            Salvar Alterações
          </Button>
        </div>
      )}
    </div>
  );
};