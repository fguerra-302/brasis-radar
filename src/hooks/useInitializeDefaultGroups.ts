import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const DEFAULT_GROUPS = [
  { name: 'Radar Brasis', description: 'Cultura, comportamento e tendências brasileiras para marcas' },
  { name: 'Clube da Glória', description: 'Consumo feminino 35+, bem-estar, entretenimento e vivência brasileira' },
  { name: 'VIEWS', description: 'Creator economy, influenciadores, marcas e plataformas' },
];

export function useInitializeDefaultGroups() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const init = async () => {
      const { data: existing } = await supabase
        .from('content_groups')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        setIsInitialized(true);
        return;
      }

      const rows = DEFAULT_GROUPS.map(g => ({ ...g, user_id: user.id }));
      await supabase.from('content_groups').insert(rows);
      setIsInitialized(true);
    };

    init();
  }, [user?.id]);

  return { isInitialized };
}
