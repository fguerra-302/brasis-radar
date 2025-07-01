
import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

const RadarHeader = () => {
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
    </div>
  );
};

export default RadarHeader;
