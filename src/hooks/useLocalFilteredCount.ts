import { useMemo } from 'react';
import { CuratedContent } from '@/types/content';

/**
 * Hook otimizado para calcular contagem de itens filtrados localmente
 * Performance: elimina queries desnecessárias ao Supabase
 */
export const useLocalFilteredCount = (items: CuratedContent[] | undefined, threshold: number) => {
  return useMemo(() => {
    if (!items || items.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Conta itens de hoje que foram FILTRADOS (< threshold)
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      itemDate.setHours(0, 0, 0, 0);
      
      return itemDate.getTime() === today.getTime() && item.score < threshold;
    }).length;
  }, [items, threshold]);
};

/**
 * Hook para estatísticas de performance em tempo real
 */
export const useFilterPerformanceStats = (items: CuratedContent[] | undefined, threshold: number) => {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalToday: 0,
        accepted: 0,
        filtered: 0,
        acceptanceRate: 0,
        suggestedThreshold: 3
      };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayItems = items.filter(item => {
      const itemDate = new Date(item.created_at);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === today.getTime();
    });
    
    const accepted = todayItems.filter(item => item.score >= threshold).length;
    const filtered = todayItems.filter(item => item.score < threshold).length;
    const acceptanceRate = todayItems.length > 0 ? (accepted / todayItems.length) * 100 : 0;
    
    // Sugestão inteligente de threshold baseada na distribuição dos scores
    const scores = todayItems.map(item => item.score).sort((a, b) => b - a);
    const suggestedThreshold = scores.length > 0 ? Math.round(scores[Math.floor(scores.length * 0.7)]) || 3 : 3;
    
    return {
      totalToday: todayItems.length,
      accepted,
      filtered,
      acceptanceRate: Math.round(acceptanceRate),
      suggestedThreshold: Math.max(1, Math.min(5, suggestedThreshold))
    };
  }, [items, threshold]);
};