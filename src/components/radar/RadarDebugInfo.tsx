
import React from 'react';

interface RadarDebugInfoProps {
  error: Error | null;
  supabaseItemsCount: number;
}

const RadarDebugInfo = ({ error, supabaseItemsCount }: RadarDebugInfoProps) => {
  if (error) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Info de Debug:</strong> Erro no Supabase - {error.message}. Usando dados de exemplo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (supabaseItemsCount === 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Informação:</strong> Nenhum dado encontrado no Supabase. Exibindo dados de exemplo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (supabaseItemsCount > 0) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-green-700">
              <strong>Sucesso:</strong> Conectado ao Supabase with {supabaseItemsCount} itens carregados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RadarDebugInfo;
