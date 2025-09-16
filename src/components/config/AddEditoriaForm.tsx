import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { colorOptions, type EditoriaWeightUI } from '@/constants/defaultEditorialWeights';

interface AddEditoriaFormProps {
  weights: EditoriaWeightUI[];
  onAdd: (editoria: EditoriaWeightUI) => void;
}

export const AddEditoriaForm = ({ weights, onAdd }: AddEditoriaFormProps) => {
  const { toast } = useToast();
  const [newEditoria, setNewEditoria] = useState({ name: '', description: '' });

  const addEditoria = () => {
    if (newEditoria.name.trim() && newEditoria.description.trim()) {
      const newColor = colorOptions[weights.length % colorOptions.length];
      
      const newEditoriaObj: EditoriaWeightUI = {
        id: `temp-${Date.now()}`,
        name: newEditoria.name.trim(),
        description: newEditoria.description.trim(),
        multiplier: 1.0,
        color: newColor
      };
      
      onAdd(newEditoriaObj);
      setNewEditoria({ name: '', description: '' });
      
      toast({
        title: "✅ Editoria adicionada",
        description: `${newEditoria.name} foi adicionada com sucesso.`,
      });
    }
  };

  return (
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
  );
};