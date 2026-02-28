
import React from 'react';

interface RadarDebugInfoProps {
  error: Error | null;
  supabaseItemsCount: number;
}

const RadarDebugInfo = ({ error, supabaseItemsCount }: RadarDebugInfoProps) => {
  if (error) {
    return (
      <div className="bg-brasis-yellow/10 border-l-4 border-brasis-yellow p-4 rounded-r-lg">
        <p className="text-sm text-foreground font-sans">
          <strong>Info de Debug:</strong> Erro no Supabase - {error.message}. Usando dados de exemplo.
        </p>
      </div>
    );
  }

  if (supabaseItemsCount === 0) {
    return (
      <div className="bg-secondary/5 border-l-4 border-secondary p-4 rounded-r-lg">
        <p className="text-sm text-foreground font-sans">
          <strong>Informação:</strong> Nenhum dado encontrado no Supabase. Exibindo dados de exemplo.
        </p>
      </div>
    );
  }

  if (supabaseItemsCount > 0) {
    return (
      <div className="bg-accent/5 border-l-4 border-accent p-4 rounded-r-lg">
        <p className="text-sm text-foreground font-sans">
          <strong>Sucesso:</strong> Conectado ao Supabase com {supabaseItemsCount} itens carregados.
        </p>
      </div>
    );
  }

  return null;
};

export default RadarDebugInfo;
