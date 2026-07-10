
import React, { useState, useMemo, useEffect } from 'react';
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

interface ContentListProps {
  supabaseData: RadarBrasisItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  groupFilter?: string;
  setGroupFilter?: (groupId: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onAprovar: (id: string, title: string) => Promise<void>;
  onIgnorar: (id: string, title: string) => Promise<void>;
  onVerOriginal: (sourceUrl: string, title: string) => void;
  onUpdateStatus: (id: string, status: string, title: string) => Promise<void>;
  onConfigurar?: () => void;
  onExecutarCuradoria: () => Promise<void>;
  onRecalcularRelevancia?: () => Promise<void>;
  updateMutation: any;
  onDeleteItem: (id: string, title: string) => Promise<void>;
  onBulkDelete: (status: string) => Promise<void>;
  onBulkDeleteIds?: (ids: string[]) => Promise<void>;
  onBulkApproveIds?: (ids: string[]) => Promise<void>;
  onBulkRejectIds?: (ids: string[]) => Promise<void>;
  onBulkSendToEditorIds?: (ids: string[]) => Promise<void>;
}


const ContentList = ({
  supabaseData, isLoading, error, searchTerm, setSearchTerm,
  statusFilter, setStatusFilter, groupFilter, setGroupFilter,
  currentPage, setCurrentPage,
  onAprovar, onIgnorar, onVerOriginal, onUpdateStatus,
  onExecutarCuradoria, onRecalcularRelevancia, updateMutation, onDeleteItem, onBulkDelete, onBulkDeleteIds,
  onBulkApproveIds, onBulkRejectIds, onBulkSendToEditorIds,
}: ContentListProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-3xl font-display text-foreground">Carregando Radar Brasis...</h1>
      </div>
    );
  }

  const items = supabaseData || [];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter === 'selecionados') {
      const selectedStatuses = ['Para Newsletter', 'Em edição', 'Publicado'];
      matchesStatus = selectedStatuses.includes(item.status);
    } else if (statusFilter !== 'todos') {
      matchesStatus = item.status === statusFilter;
    }
    const matchesGroup = !groupFilter || groupFilter === 'todos' || item.group_id === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPaginationItems = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) rangeWithDots.push(1, '...');
    else rangeWithDots.push(1);
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) rangeWithDots.push('...', totalPages);
    else rangeWithDots.push(totalPages);
    return rangeWithDots;
  };

  return (
    <div className="space-y-6">
      <RadarDebugInfo error={error} supabaseItemsCount={supabaseData?.length || 0} />
  const filteredIdSet = useMemo(() => new Set(filteredItems.map(i => i.id)), [filteredItems]);
  const effectiveSelected = useMemo(() => selectedIds.filter(id => filteredIdSet.has(id)), [selectedIds, filteredIdSet]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  };
  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredItems.map(i => i.id) : []);
  };
  const clearSelection = () => setSelectedIds([]);

  const wrapBulk = (fn?: (ids: string[]) => Promise<void>) => fn
    ? async (ids: string[]) => { await fn(ids); clearSelection(); }
    : undefined;

  return (
    <div className="space-y-6">
      <RadarDebugInfo error={error} supabaseItemsCount={supabaseData?.length || 0} />
      <ContentFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} groupFilter={groupFilter} setGroupFilter={setGroupFilter} onExecutarCuradoria={onExecutarCuradoria} onRecalcularRelevancia={onRecalcularRelevancia} />
      <BulkActions
        filteredItems={filteredItems}
        statusFilter={statusFilter}
        onBulkDelete={onBulkDelete}
        onBulkDeleteIds={wrapBulk(onBulkDeleteIds)}
        isUpdating={updateMutation.isPending}
        selectedIds={effectiveSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={clearSelection}
        onBulkApproveIds={wrapBulk(onBulkApproveIds)}
        onBulkRejectIds={wrapBulk(onBulkRejectIds)}
        onBulkSendToEditorIds={wrapBulk(onBulkSendToEditorIds)}
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
                selected={effectiveSelected.includes(item.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                  </PaginationItem>
                  {totalPages <= 7 ? (
                    [...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink onClick={() => setCurrentPage(index + 1)} isActive={currentPage === index + 1} className="cursor-pointer">{index + 1}</PaginationLink>
                      </PaginationItem>
                    ))
                  ) : (
                    getPaginationItems().map((item, index) => (
                      <PaginationItem key={index}>
                        {item === '...' ? <PaginationEllipsis /> : (
                          <PaginationLink onClick={() => setCurrentPage(Number(item))} isActive={currentPage === item} className="cursor-pointer">{item}</PaginationLink>
                        )}
                      </PaginationItem>
                    ))
                  )}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
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
