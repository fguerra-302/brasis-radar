
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bot, Zap } from 'lucide-react';

interface RadarEmptyProps {
  onExecutarCuradoria: () => void;
}

const RadarEmpty = ({ onExecutarCuradoria }: RadarEmptyProps) => {
  return (
    <div className="text-center py-12">
      <Bot className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
      <h3 className="text-xl font-display text-foreground mb-2">
        Nenhum conteúdo encontrado
      </h3>
      <p className="text-muted-foreground mb-6 font-sans">
        Tente ajustar os filtros ou execute a curadoria IA para coletar mais conteúdos
      </p>
      <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-sans" onClick={onExecutarCuradoria}>
        <Zap className="h-4 w-4 mr-2" />
        Iniciar Curadoria
      </Button>
    </div>
  );
};

export default RadarEmpty;
