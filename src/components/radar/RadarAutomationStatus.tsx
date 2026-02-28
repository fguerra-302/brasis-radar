import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, Activity, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const RadarAutomationStatus = () => {
  const [isActive, setIsActive] = useState(true);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [nextRun, setNextRun] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const now = new Date();
    const minutesUntilNext = 30 - (now.getMinutes() % 30);
    const nextRunTime = new Date(now.getTime() + minutesUntilNext * 60000);
    setNextRun(nextRunTime);
    const lastRunTime = new Date(now.getTime() - (30 - minutesUntilNext) * 60000);
    setLastRun(lastRunTime);

    const interval = setInterval(() => {
      const currentTime = new Date();
      const mins = 30 - (currentTime.getMinutes() % 30);
      setNextRun(new Date(currentTime.getTime() + mins * 60000));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleAutomation = async () => {
    try {
      if (isActive) {
        setIsActive(false);
        toast({ title: "⏸️ Automação Pausada", description: "A coleta automatizada foi pausada." });
      } else {
        toast({ title: "▶️ Automação Reativada", description: "A coleta automatizada foi reativada." });
        setIsActive(true);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao alterar status da automação.", variant: "destructive" });
    }
  };

  const formatTimeUntilNext = () => {
    if (!nextRun) return "--";
    const now = new Date();
    const diffMs = nextRun.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins <= 0) return "Executando agora...";
    if (diffMins === 1) return "1 minuto";
    return `${diffMins} minutos`;
  };

  return (
    <Card className="border-l-4 border-l-accent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Coleta Automatizada
          </CardTitle>
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-accent/10 text-accent border-accent/30" : ""}
          >
            {isActive ? (
              <><Activity className="h-3 w-3 mr-1" /> Ativa</>
            ) : (
              <><Pause className="h-3 w-3 mr-1" /> Pausada</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm font-sans">
          <div>
            <span className="text-muted-foreground">Frequência:</span>
            <p className="font-medium text-foreground">A cada 30 minutos</p>
          </div>
          <div>
            <span className="text-muted-foreground">Próxima coleta:</span>
            <p className="font-medium text-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeUntilNext()}
            </p>
          </div>
        </div>

        {lastRun && (
          <div className="text-sm font-sans">
            <span className="text-muted-foreground">Última execução:</span>
            <p className="font-medium text-foreground">{lastRun.toLocaleString('pt-BR')}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant={isActive ? "outline" : "default"} size="sm" onClick={handleToggleAutomation} className="flex items-center gap-1">
            {isActive ? (<><Pause className="h-3 w-3" /> Pausar</>) : (<><Play className="h-3 w-3" /> Ativar</>)}
          </Button>
        </div>

        <div className="bg-accent/5 border border-accent/20 p-3 rounded-md">
          <p className="text-xs text-accent font-sans">
            ✨ O sistema coleta automaticamente de todas as fontes RSS configuradas, 
            analisa a relevância e adiciona os melhores conteúdos para curadoria.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
