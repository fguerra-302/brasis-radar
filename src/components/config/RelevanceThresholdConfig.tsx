import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Info, TrendingUp, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PerformanceStats {
  totalToday: number;
  accepted: number;
  filtered: number;
  acceptanceRate: number;
  suggestedThreshold: number;
}

interface RelevanceThresholdConfigProps {
  threshold: number;
  onChange: (value: number) => void;
  filteredCount?: number;
  performanceStats?: PerformanceStats;
}

export const RelevanceThresholdConfig = ({ 
  threshold, 
  onChange, 
  filteredCount = 0,
  performanceStats
}: RelevanceThresholdConfigProps) => {
  const getThresholdDescription = (value: number) => {
    switch (value) {
      case 1: return "Muito baixa - aceita quase todos os conteúdos";
      case 2: return "Baixa - aceita maioria dos conteúdos";
      case 3: return "Média - filtra conteúdos com pouca relevância";
      case 4: return "Alta - aceita apenas conteúdos relevantes";
      case 5: return "Muito alta - aceita apenas conteúdos extremamente relevantes";
      default: return "";
    }
  };

  const getThresholdColor = (value: number) => {
    if (value <= 2) return "text-red-600";
    if (value === 3) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">
          Relevância Mínima: {threshold}
        </Label>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="space-y-3">
        <Slider
          value={[threshold]}
          onValueChange={(value) => onChange(value[0])}
          max={5}
          min={1}
          step={1}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Baixa (1)</span>
          <span>Média (3)</span>
          <span>Alta (5)</span>
        </div>
        
        <p className={`text-sm font-medium ${getThresholdColor(threshold)}`}>
          {getThresholdDescription(threshold)}
        </p>
      </div>

      {/* Performance Stats */}
      {performanceStats && performanceStats.totalToday > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {performanceStats.acceptanceRate}% aceitos hoje
            </Badge>
            {performanceStats.suggestedThreshold !== threshold && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Sugestão: {performanceStats.suggestedThreshold}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Hoje: {performanceStats.accepted} aceitos, {performanceStats.filtered} filtrados
          </div>
        </div>
      )}

      {filteredCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{filteredCount} itens</span> foram filtrados 
            hoje por não atingirem a relevância mínima de {threshold}.
            {performanceStats?.suggestedThreshold && performanceStats.suggestedThreshold !== threshold && (
              <span className="block mt-1 text-xs">
                💡 Sugestão: ajuste para {performanceStats.suggestedThreshold} baseado no padrão de hoje
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};