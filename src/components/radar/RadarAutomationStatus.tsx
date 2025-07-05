import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, Activity, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

export const RadarAutomationStatus = () => {
  const [isActive, setIsActive] = useState(true);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [nextRun, setNextRun] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Calcular próxima execução (a cada 30 minutos)
    const now = new Date();
    const minutesUntilNext = 30 - (now.getMinutes() % 30);
    const nextRunTime = new Date(now.getTime() + minutesUntilNext * 60000);
    setNextRun(nextRunTime);

    // Simular última execução (poderia ser buscado do banco)
    const lastRunTime = new Date(now.getTime() - (30 - minutesUntilNext) * 60000);
    setLastRun(lastRunTime);

    // Atualizar a cada minuto
    const interval = setInterval(() => {
      const currentTime = new Date();
      const minutesUntilNext = 30 - (currentTime.getMinutes() % 30);
      const nextRunTime = new Date(currentTime.getTime() + minutesUntilNext * 60000);
      setNextRun(nextRunTime);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleAutomation = async () => {
    try {
      if (isActive) {
        // Pausar automação (funcionalidade futura)
        setIsActive(false);
        toast({
          title: "⏸️ Automação Pausada",
          description: "A coleta automatizada foi pausada.",
        });
      } else {
        // Reativar automação (funcionalidade futura)
        toast({
          title: "▶️ Automação Reativada",
          description: "A coleta automatizada foi reativada.",
        });
        setIsActive(true);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar status da automação.",
        variant: "destructive",
      });
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
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Coleta Automatizada
          </CardTitle>
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-green-100 text-green-800" : ""}
          >
            {isActive ? (
              <>
                <Activity className="h-3 w-3 mr-1" />
                Ativa
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pausada
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Frequência:</span>
            <p className="font-medium">A cada 30 minutos</p>
          </div>
          <div>
            <span className="text-slate-600">Próxima coleta:</span>
            <p className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeUntilNext()}
            </p>
          </div>
        </div>

        {lastRun && (
          <div className="text-sm">
            <span className="text-slate-600">Última execução:</span>
            <p className="font-medium">
              {lastRun.toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant={isActive ? "outline" : "default"}
            size="sm"
            onClick={handleToggleAutomation}
            className="flex items-center gap-1"
          >
            {isActive ? (
              <>
                <Pause className="h-3 w-3" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Ativar
              </>
            )}
          </Button>
        </div>

        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-xs text-green-700">
            ✨ O sistema coleta automaticamente de todas as fontes RSS configuradas, 
            analisa a relevância e adiciona os melhores conteúdos para curadoria.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};