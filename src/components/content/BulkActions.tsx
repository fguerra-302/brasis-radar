import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadarBrasisItem } from '@/hooks/useRadarBrasis';

interface BulkActionsProps {
  filteredItems: RadarBrasisItem[];
  statusFilter: string;
  onBulkDelete: (status: string) => Promise<void>;
  isUpdating: boolean;
}

const BulkActions = ({ filteredItems, statusFilter, onBulkDelete, isUpdating }: BulkActionsProps) => {
  const rejectedCount = filteredItems.filter(item => item.status === 'Ignorado').length;
  const approvalCount = filteredItems.filter(item => item.status === 'Em aprovação').length;

  if (filteredItems.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-foreground font-sans">
          {filteredItems.length} itens encontrados
        </span>
        {rejectedCount > 0 && (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive">{rejectedCount} rejeitados</Badge>
        )}
        {approvalCount > 0 && (
          <Badge variant="secondary" className="bg-brasis-yellow/15 text-brasis-yellow-foreground">{approvalCount} em aprovação</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rejectedCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 font-sans" disabled={isUpdating}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Rejeitados ({rejectedCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Excluir itens rejeitados</AlertDialogTitle>
                <AlertDialogDescription className="font-sans">
                  Tem certeza que deseja excluir todos os {rejectedCount} itens rejeitados? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onBulkDelete('Ignorado')} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Excluir {rejectedCount} itens
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {statusFilter === 'todos' && approvalCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-primary border-primary/30 hover:bg-primary/10 font-sans" disabled={isUpdating}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar Em Aprovação ({approvalCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Resetar itens em aprovação</AlertDialogTitle>
                <AlertDialogDescription className="font-sans">
                  Tem certeza que deseja excluir todos os {approvalCount} itens em aprovação? Esta ação remove itens que ainda não foram processados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onBulkDelete('Em aprovação')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Resetar {approvalCount} itens
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default BulkActions;