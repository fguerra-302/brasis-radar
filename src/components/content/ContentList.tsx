
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { RadarBrasisItem } from '@/hooks/useRadarBrasis';
import { ContentStatus } from '@/types/content';
import ContentFilters from './ContentFilters';
import RadarDebugInfo from '../radar/RadarDebugInfo';
import RadarEmpty from '../radar/RadarEmpty';
import ContentCard from './ContentCard';
import BulkActions from './BulkActions';

const ITEMS_PER_PAGE = 9;

// Remover dados mock - sistema agora usa apenas dados reais do Supabase

interface ContentListProps {
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
  onVerOriginal: (sourceUrl: string, title: string) => void;
  onUpdateStatus: (id: string, status: string, title: string) => Promise<void>;
  onConfigurar: () => void;
  onExecutarCuradoria: () => Promise<void>;
  onRecalcularRelevancia?: () => Promise<void>;
  updateMutation: any;
  onDeleteItem: (id: string, title: string) => Promise<void>;
  onBulkDelete: (status: string) => Promise<void>;
}

const ContentList = ({
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
  onUpdateStatus,
  onConfigurar,
  onExecutarCuradoria,
  onRecalcularRelevancia,
  updateMutation,
  onDeleteItem,
  onBulkDelete
}: ContentListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <h1 className="text-3xl font-bold text-slate-800">Carregando Radar Brasis...</h1>
      </div>
    );
  }

  // Usa apenas dados do Supabase
  const items = supabaseData || [];

  // Filtros
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'selecionados') {
      // Mostra apenas itens selecionados para curadoria
      const selectedStatuses = [
        'Para Newsletter',
        'Para Redes Sociais', 
        'Para Newsletter e Redes',
        'Na Newsletter',
        'Em edição'
      ];
      matchesStatus = selectedStatuses.includes(item.status);
    } else if (statusFilter !== 'todos') {
      matchesStatus = item.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Helper para gerar números das páginas com janela
  const getPaginationItems = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="space-y-6">
      <RadarDebugInfo 
        error={error} 
        supabaseItemsCount={supabaseData?.length || 0}
      />

      <ContentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onConfigurar={onConfigurar}
        onExecutarCuradoria={onExecutarCuradoria}
        onRecalcularRelevancia={onRecalcularRelevancia}
      />

      <BulkActions
        filteredItems={filteredItems}
        statusFilter={statusFilter}
        onBulkDelete={onBulkDelete}
        isUpdating={updateMutation.isPending}
      />

      {filteredItems.length === 0 ? (
        <RadarEmpty onExecutarCuradoria={onExecutarCuradoria} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onAprovar={onAprovar}
                onIgnorar={onIgnorar}
                onVerOriginal={onVerOriginal}
                onUpdateStatus={onUpdateStatus}
                onDeleteItem={onDeleteItem}
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
                  
                  {totalPages <= 7 ? (
                    // Show all pages if total is 7 or less
                    [...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          onClick={() => setCurrentPage(index + 1)}
                          isActive={currentPage === index + 1}
                          className="cursor-pointer"
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))
                  ) : (
                    // Show smart pagination with ellipses
                    getPaginationItems().map((item, index) => (
                      <PaginationItem key={index}>
                        {item === '...' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(Number(item))}
                            isActive={currentPage === item}
                            className="cursor-pointer"
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))
                  )}
                  
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

export default ContentList;
