import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import { type EditoriaWeightUI } from '@/constants/defaultEditorialWeights';

interface EditorialWeightCardProps {
  editoria: EditoriaWeightUI;
  index: number;
  onUpdateWeight: (index: number, multiplier: number) => void;
  onRemove: (index: number) => void;
}

export const EditorialWeightCard = ({ 
  editoria, 
  index, 
  onUpdateWeight, 
  onRemove 
}: EditorialWeightCardProps) => {
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
    <Card className="transition-all hover:shadow-md">
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
              onClick={() => onRemove(index)}
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
            onValueChange={(value) => onUpdateWeight(index, value[0])}
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
  );
};