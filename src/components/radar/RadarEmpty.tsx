
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bot, Zap } from 'lucide-react';

interface RadarEmptyProps {
  onExecutarCuradoria: () => void;
}

const RadarEmpty = ({ onExecutarCuradoria }: RadarEmptyProps) => {
  return (
    <div className="text-center py-12">
      <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-600 mb-2">
        Nenhum conteúdo encontrado
      </h3>
      <p className="text-slate-500 mb-6">
        Tente ajustar os filtros ou execute a curadoria IA para coletar mais conteúdos
      </p>
      <Button 
        className="bg-indigo-600 hover:bg-indigo-700"
        onClick={onExecutarCuradoria}
      >
        <Zap className="h-4 w-4 mr-2" />
        Iniciar Curadoria
      </Button>
    </div>
  );
};

export default RadarEmpty;
