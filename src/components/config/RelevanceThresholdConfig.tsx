import { Label } from "@/components/ui/label";
import { Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface RelevanceThresholdConfigProps {
  threshold: number;
  onChange: (value: number) => void;
  filteredCount?: number;
}

const presets = [
  {
    value: 1,
    label: "Aceitar tudo",
    description: "Todos os conteúdos coletados aparecem no radar. Recomendado para iniciantes.",
    recommended: true,
  },
  {
    value: 2,
    label: "Filtrar spam",
    description: "Remove apenas conteúdos claramente irrelevantes.",
    recommended: false,
  },
  {
    value: 3,
    label: "Curadoria moderada",
    description: "Mostra apenas conteúdos com alguma relevância para suas palavras-chave.",
    recommended: false,
  },
  {
    value: 4,
    label: "Curadoria rigorosa",
    description: "Aceita apenas conteúdos altamente relevantes. Requer palavras-chave bem configuradas.",
    recommended: false,
  },
];

export const RelevanceThresholdConfig = ({ 
  threshold, 
  onChange, 
  filteredCount = 0,
}: RelevanceThresholdConfigProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">
          Nível de Filtragem
        </Label>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={cn(
              "relative rounded-lg border-2 p-4 text-left transition-all",
              "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40",
              threshold === preset.value
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-background hover:border-primary/40"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">
                {preset.label}
              </span>
              {preset.recommended && (
                <span className="text-[10px] font-bold uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  Recomendado
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {preset.description}
            </p>
          </button>
        ))}
      </div>

      {threshold >= 3 && (
        <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
            Com nível <strong>{threshold}</strong>, conteúdos que não combinam com suas palavras-chave serão descartados silenciosamente.
            Se seu radar estiver vazio, tente <button onClick={() => onChange(1)} className="underline font-semibold hover:text-primary">reduzir para "Aceitar tudo"</button>.
          </AlertDescription>
        </Alert>
      )}

      {filteredCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{filteredCount} itens</span> foram filtrados 
            hoje por não atingirem o nível mínimo de relevância.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
