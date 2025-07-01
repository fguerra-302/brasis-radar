
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Temporariamente removendo dependência do Supabase para debug
interface RadarBrasisRow {
  id: string;
  title: string;
  link: string;
  source: string;
  pub_date: string;
  editoria: string;
  tags: string[];
  relevancia: number;
  status: string;
  resumo_curado: string;
  created_at: string;
  updated_at?: string;
}

export interface RadarBrasisItem extends RadarBrasisRow {}

export const useRadarBrasis = () => {
  return useQuery({
    queryKey: ['radar-brasis'],
    queryFn: async (): Promise<RadarBrasisItem[]> => {
      console.log('Hook useRadarBrasis sendo executado');
      // Retorna dados mockados por enquanto
      return [
        {
          id: '1',
          title: 'Sistema funcionando corretamente',
          link: 'https://example.com/1',
          source: 'Debug Test',
          pub_date: '2024-07-01T10:00:00Z',
          editoria: 'Sistema',
          tags: ['debug', 'test'],
          relevancia: 3,
          status: 'A curar',
          resumo_curado: 'O sistema está carregando os dados corretamente.',
          created_at: '2024-07-01T10:00:00Z'
        }
      ];
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<RadarBrasisItem> }) => {
      console.log('Simulando atualização:', { id, payload });
      // Simula operação de atualização por enquanto
      return { id, ...payload };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};

export const useCreateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<RadarBrasisItem, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('Simulando criação:', payload);
      // Simula operação de criação por enquanto
      return { id: Date.now().toString(), ...payload, created_at: new Date().toISOString() };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};
