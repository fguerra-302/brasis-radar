
import React from 'react';
import { Bot, Sparkles, Edit3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { UserMenu } from '@/components/UserMenu';

const RadarHeader = () => {
  const navigate = useNavigate();
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex items-center justify-center gap-4">
        <Bot className="h-10 w-10 text-primary" />
        <h1 className="text-5xl font-bold brasis-text-gradient font-brasis">
          RADAR BRASIS
        </h1>
        <Sparkles className="h-10 w-10 text-secondary" />
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-warm opacity-10 rounded-2xl"></div>
        <p className="text-xl text-foreground max-w-4xl mx-auto relative z-10 py-6 px-8 font-medium">
          Newsletter inteligente que acessa múltiplas fontes e faz curadoria automática do Brasil real
        </p>
      </div>
      <div className="flex justify-center items-center gap-6 pt-6">
        <Button 
          onClick={() => navigate('/curadoria')}
          className="brasis-button-primary text-white font-semibold px-6 py-3 rounded-lg"
        >
          <Edit3 className="h-5 w-5 mr-2" />
          Área de Curadoria
        </Button>
        <Button 
          onClick={() => navigate('/config')}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-white font-semibold px-6 py-3"
        >
          Configurações
        </Button>
        <div className="ml-4">
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default RadarHeader;
