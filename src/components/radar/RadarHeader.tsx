
import React from 'react';
import { Bot, Sparkles, Edit3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const RadarHeader = () => {
  const navigate = useNavigate();
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Bot className="h-8 w-8 text-indigo-600" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Radar Brasis
        </h1>
        <Sparkles className="h-8 w-8 text-purple-600" />
      </div>
      <p className="text-xl text-slate-600 max-w-3xl mx-auto">
        Newsletter inteligente que acessa múltiplas fontes e faz curadoria automática do Brasil real
      </p>
      <div className="flex justify-center gap-4 pt-4">
        <Button 
          onClick={() => navigate('/curadoria')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Área de Curadoria
        </Button>
        <Button 
          onClick={() => navigate('/config')}
          variant="outline"
        >
          Configurações
        </Button>
      </div>
    </div>
  );
};

export default RadarHeader;
