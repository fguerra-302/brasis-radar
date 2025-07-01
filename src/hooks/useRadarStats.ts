
import { useMemo } from 'react';
import { useRadarBrasis } from './useRadarBrasis';

export const useRadarStats = () => {
  const { data: items, isLoading } = useRadarBrasis();

  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        total: 0,
        aCurar: 0,
        emAprovacao: 0,
        publicados: 0,
        ignorados: 0,
        hoje: 0,
        ultimaHora: 0
      };
    }

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);

    return {
      total: items.length,
      aCurar: items.filter(item => item.status === 'A curar').length,
      emAprovacao: items.filter(item => item.status === 'Em aprovação').length,
      publicados: items.filter(item => item.status === 'Publicado').length,
      ignorados: items.filter(item => item.status === 'Ignorado').length,
      hoje: items.filter(item => new Date(item.created_at) >= hoje).length,
      ultimaHora: items.filter(item => new Date(item.created_at) >= umaHoraAtras).length
    };
  }, [items]);

  return { stats, isLoading };
};
