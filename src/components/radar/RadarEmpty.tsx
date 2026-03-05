import React from 'react';
import { Button } from "@/components/ui/button";
import { Bot, Zap, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RadarEmptyProps {
  onExecutarCuradoria: () => void;
}

const RadarEmpty = ({ onExecutarCuradoria }: RadarEmptyProps) => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <Bot className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
      <h3 className="text-xl font-display text-foreground mb-2">
        Nenhum conteúdo encontrado
      </h3>
      <p className="text-muted-foreground mb-6 font-sans">
        Tente ajustar os filtros ou execute a curadoria IA para coletar mais conteúdos
      </p>

      <Alert className="max-w-md mx-auto mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 text-left">
        <SlidersHorizontal className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
          <strong>Dica:</strong> Seus conteúdos podem estar sendo filtrados pela relevância mínima.{' '}
          <button 
            onClick={() => navigate('/config')} 
            className="underline font-semibold hover:text-primary"
          >
            Reduza o nível nas configurações
          </button>{' '}
          para ver mais resultados.
        </AlertDescription>
      </Alert>

      <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-sans" onClick={onExecutarCuradoria}>
        <Zap className="h-4 w-4 mr-2" />
        Iniciar Curadoria
      </Button>
    </div>
  );
};

export default RadarEmpty;
