
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { RadarBrasisItem } from '@/hooks/useRadarBrasis';
import RadarFilters from './RadarFilters';
import RadarDebugInfo from './RadarDebugInfo';
import RadarEmpty from './RadarEmpty';
import RadarCard from './RadarCard';

const ITEMS_PER_PAGE = 9;

// Dados de exemplo para fallback
const mockData = [
  {
    id: '1',
    title: 'Startup baiana desenvolve tecnologia sustentável',
    link: 'https://example.com/1',
    source: 'Portal Local BA',
    pub_date: '2024-07-01T10:00:00Z',
    editoria: 'Negócios',
    tags: ['startup', 'sustentabilidade', 'bahia'],
    relevancia: 3,
    status: 'A curar',
    resumo_curado: 'Empresa baiana inova no setor de energia limpa com solução revolucionária.',
    created_at: '2024-07-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Festival de cultura nordestina acontece em Salvador',
    link: 'https://example.com/2',
    source: 'Cultura BA',
    pub_date: '2024-07-01T14:00:00Z',
    editoria: 'Cultura',
    tags: ['festival', 'cultura', 'salvador'],
    relevancia: 2,
    status: 'Em aprovação',
    resumo_curado: 'Evento celebra tradições nordestinas com shows e gastronomia típica.',
    created_at: '2024-07-01T14:00:00Z'
  },
  {
    id: '3',
    title: 'Projeto social transforma comunidade no interior',
    link: 'https://example.com/3',
    source: 'Social Impact',
    pub_date: '2024-07-01T16:00:00Z',
    editoria: 'Social',
    tags: ['projeto social', 'comunidade', 'interior'],
    relevancia: 3,
    status: 'Publicado',
    resumo_curado: 'Iniciativa local promove educação e desenvolvimento econômico.',
    created_at: '2024-07-01T16:00:00Z'
  }
];

interface RadarContentProps {
  supabaseData: RadarBrasisItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onAprovar: (id: string, title: string) => Promise<void>;
  onIgnorar: (id: string, title: string) => Promise<void>;
  onVerOriginal: (link: string, title: string) => void;
  onConfigurar: () => void;
  onExecutarCuradoria: () => Promise<void>;
  updateMutation: any;
}

const RadarContent = ({
  supabaseData,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  onAprovar,
  onIgnorar,
  onVerOriginal,
  onConfigurar,
  onExecutarCuradoria,
  updateMutation
}: RadarContentProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <h1 className="text-3xl font-bold text-slate-800">Carregando Radar Brasis...</h1>
      </div>
    );
  }

  // Usa dados do Supabase se disponíveis, senão usa mock data
  const items = supabaseData && supabaseData.length > 0 ? supabaseData : mockData;

  // Filtros
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <RadarDebugInfo 
        error={error} 
        supabaseItemsCount={supabaseData?.length || 0}
      />

      <RadarFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onConfigurar={onConfigurar}
        onExecutarCuradoria={onExecutarCuradoria}
      />

      {filteredItems.length === 0 ? (
        <RadarEmpty onExecutarCuradoria={onExecutarCuradoria} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedItems.map((item) => (
              <RadarCard
                key={item.id}
                item={item}
                onAprovar={onAprovar}
                onIgnorar={onIgnorar}
                onVerOriginal={onVerOriginal}
                isUpdating={updateMutation.isPending}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => setCurrentPage(index + 1)}
                        isActive={currentPage === index + 1}
                        className="cursor-pointer"
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RadarContent;
