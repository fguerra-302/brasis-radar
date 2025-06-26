
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface RadarBrasisItem {
  id: string;
  title: string;
  link: string;
  source: string;
  pub_date: string;
  editoria: string;
  tags: string[];
  relevancia: number;
  status: string;
  input_bruto?: string;
  resumo_curado?: string;
  created_at: string;
}

// Mock data for demonstration - replace with actual Supabase calls
const mockData: RadarBrasisItem[] = [
  {
    id: '1',
    title: 'Nova tendência cultural emerge no Nordeste brasileiro',
    link: 'https://example.com/1',
    source: 'G1 Nordeste',
    pub_date: '2024-01-15',
    editoria: 'Cultura',
    tags: ['nordeste', 'cultura', 'tendência'],
    relevancia: 4,
    status: 'A curar',
    resumo_curado: 'Movimento cultural no Nordeste revela nova potência criativa que pode interessar marcas buscando autenticidade regional.',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Startup de educação cresce 300% em escolas públicas',
    link: 'https://example.com/2',
    source: 'UOL',
    pub_date: '2024-01-14',
    editoria: 'Negócios',
    tags: ['educação', 'startup', 'escolas públicas'],
    relevancia: 5,
    status: 'Em aprovação',
    resumo_curado: 'Inovação educacional mostra como tecnologia pode transformar ensino público brasileiro.',
    created_at: '2024-01-14T15:30:00Z'
  }
];

export const useRadarBrasis = () => {
  return useQuery({
    queryKey: ['radar-brasis'],
    queryFn: async (): Promise<RadarBrasisItem[]> => {
      // TODO: Replace with actual Supabase call
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockData), 500);
      });
    },
  });
};

export const useUpdateRadarBrasis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<RadarBrasisItem> }) => {
      // TODO: Replace with actual Supabase update call
      console.log('Updating item:', id, payload);
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });
};
