import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Trash2, RotateCcw, Trash, CheckCircle, XCircle, Send, Loader2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadarBrasisItem } from '@/hooks/useRadarBrasis';

interface BulkActionsProps {
  filteredItems: RadarBrasisItem[];
  statusFilter: string;
  onBulkDelete: (status: string) => Promise<void>;
  onBulkDeleteIds?: (ids: string[]) => Promise<void>;
  isUpdating: boolean;
  selectedIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onBulkApproveIds?: (ids: string[]) => Promise<void>;
  onBulkRejectIds?: (ids: string[]) => Promise<void>;
  onBulkSendToEditorIds?: (ids: string[]) => Promise<void>;
}

type PendingAction =
  | { kind: 'clear-collected'; count: number }
  | { kind: 'clear-rejected'; count: number }
  | { kind: 'reset-approval'; count: number }
  | { kind: 'delete-filtered'; count: number }
  | { kind: 'delete-selected'; count: number }
  | { kind: 'approve-selected'; count: number }
  | { kind: 'reject-selected'; count: number }
  | { kind: 'send-editor-selected'; count: number }
  | null;

const BulkActions = ({
  filteredItems, statusFilter, onBulkDelete, onBulkDeleteIds, isUpdating,
  selectedIds, onToggleSelectAll, onClearSelection,
  onBulkApproveIds, onBulkRejectIds, onBulkSendToEditorIds,
}: BulkActionsProps) => {
  const [pending, setPending] = useState<PendingAction>(null);

  const rejectedCount = filteredItems.filter(i => i.status === 'Ignorado').length;
  const approvalCount = filteredItems.filter(i => i.status === 'Em aprovação').length;
  const collectedCount = filteredItems.filter(i => i.status === 'Coletado').length;
  const selectedCount = selectedIds.length;
  const allSelected = filteredItems.length > 0 && selectedCount === filteredItems.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const runConfirmed = async () => {
    if (!pending) return;
    const p = pending;
    setPending(null);
    switch (p.kind) {
      case 'clear-collected': return onBulkDelete('Coletado');
      case 'clear-rejected': return onBulkDelete('Ignorado');
      case 'reset-approval': return onBulkDelete('Em aprovação');
      case 'delete-filtered': return onBulkDeleteIds?.(filteredItems.map(i => i.id));
      case 'delete-selected': return onBulkDeleteIds?.(selectedIds);
      case 'approve-selected': return onBulkApproveIds?.(selectedIds);
      case 'reject-selected': return onBulkRejectIds?.(selectedIds);
      case 'send-editor-selected': return onBulkSendToEditorIds?.(selectedIds);
    }
  };

  const confirmCopy: Record<Exclude<PendingAction, null>['kind'], { title: string; desc: string; danger?: boolean }> = {
    'clear-collected': { title: 'Excluir itens coletados', desc: 'Marca todos os itens no status "Coletado" como excluídos permanentemente (com tombstone, não voltam na próxima coleta).', danger: true },
    'clear-rejected': { title: 'Excluir itens rejeitados', desc: 'Remove todos os itens rejeitados. Ação irreversível.', danger: true },
    'reset-approval': { title: 'Resetar itens em aprovação', desc: 'Remove todos os itens em aprovação que ainda não foram processados.' },
    'delete-filtered': { title: 'Excluir todos os itens filtrados', desc: 'Exclui exatamente os itens exibidos agora (respeitando busca/grupo/status). Cria tombstones e impede recoleta.', danger: true },
    'delete-selected': { title: 'Excluir itens selecionados', desc: 'Exclui os itens marcados nesta tela. Cria tombstones. Ação irreversível.', danger: true },
    'approve-selected': { title: 'Aprovar itens selecionados', desc: 'Envia os itens marcados para "Em aprovação".' },
    'reject-selected': { title: 'Rejeitar itens selecionados', desc: 'Marca os itens selecionados como "Ignorado".' },
    'send-editor-selected': { title: 'Enviar selecionados para edição', desc: 'Muda o status dos itens marcados para "Em edição".' },
  };

  return (
    <>
      <div className="p-4 bg-card border-2 border-primary/20 rounded-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Checkbox
              id="bulk-select-all"
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(v) => onToggleSelectAll(v === true)}
              disabled={filteredItems.length === 0}
              aria-label="Selecionar todos os itens filtrados"
            />
            <label htmlFor="bulk-select-all" className="text-sm font-semibold text-foreground font-sans cursor-pointer">
              Ações em massa
            </label>
            <span className="text-sm text-muted-foreground font-sans">
              {selectedCount > 0 ? `${selectedCount} selecionado(s) de ${filteredItems.length}` : `${filteredItems.length} itens filtrados`}
            </span>
            {collectedCount > 0 && <Badge variant="secondary" className="bg-primary/10 text-primary">{collectedCount} coletados</Badge>}
            {approvalCount > 0 && <Badge variant="secondary" className="bg-brasis-yellow/15 text-brasis-yellow-foreground">{approvalCount} em aprovação</Badge>}
            {rejectedCount > 0 && <Badge variant="secondary" className="bg-destructive/10 text-destructive">{rejectedCount} rejeitados</Badge>}
          </div>

          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Button size="sm" variant="ghost" onClick={onClearSelection} className="font-sans">Limpar seleção</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
                  disabled={isUpdating || filteredItems.length === 0}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedCount > 0 ? `Ações em ${selectedCount} selecionado(s)` : 'Ações em massa'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {selectedCount > 0 ? (
                  <>
                    <DropdownMenuLabel className="font-sans">Nos {selectedCount} selecionados</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={!onBulkApproveIds} onClick={() => setPending({ kind: 'approve-selected', count: selectedCount })}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Enviar para aprovação
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!onBulkSendToEditorIds} onClick={() => setPending({ kind: 'send-editor-selected', count: selectedCount })}>
                      <Send className="h-4 w-4 mr-2" /> Enviar para edição
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!onBulkRejectIds} onClick={() => setPending({ kind: 'reject-selected', count: selectedCount })}>
                      <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={!onBulkDeleteIds}
                      className="text-destructive focus:text-destructive"
                      onClick={() => setPending({ kind: 'delete-selected', count: selectedCount })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir permanentemente
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="font-sans">Na visão atual</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={collectedCount === 0}
                      onClick={() => setPending({ kind: 'clear-collected', count: collectedCount })}
                    >
                      <Trash className="h-4 w-4 mr-2" /> Limpar Coletados ({collectedCount})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={rejectedCount === 0}
                      onClick={() => setPending({ kind: 'clear-rejected', count: rejectedCount })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Limpar Rejeitados ({rejectedCount})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={statusFilter !== 'todos' || approvalCount === 0}
                      onClick={() => setPending({ kind: 'reset-approval', count: approvalCount })}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Resetar Em Aprovação ({approvalCount})
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={!onBulkDeleteIds || filteredItems.length === 0}
                      className="text-destructive focus:text-destructive"
                      onClick={() => setPending({ kind: 'delete-filtered', count: filteredItems.length })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir todos os filtrados ({filteredItems.length})
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{pending && confirmCopy[pending.kind].title}</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {pending && confirmCopy[pending.kind].desc}
              {pending && <> <br /><br /><strong>{pending.count} itens</strong> serão afetados.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirmed}
              className={pending && confirmCopy[pending.kind].danger ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : undefined}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActions;
