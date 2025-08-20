import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadarBrasisItem } from '@/hooks/useRadarBrasis';

interface BulkActionsProps {
  filteredItems: RadarBrasisItem[];
  statusFilter: string;
  onBulkDelete: (status: string) => Promise<void>;
  isUpdating: boolean;
}

const BulkActions = ({ filteredItems, statusFilter, onBulkDelete, isUpdating }: BulkActionsProps) => {
  // Use string values as they appear in the database
  const rejectedCount = filteredItems.filter(item => 
    item.status === 'Ignorado'
  ).length;
  
  const approvalCount = filteredItems.filter(item => item.status === 'Em aprovação').length;

  if (filteredItems.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">
          {filteredItems.length} itens encontrados
        </span>
        
        {rejectedCount > 0 && (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {rejectedCount} rejeitados
          </Badge>
        )}
        
        {approvalCount > 0 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {approvalCount} em aprovação
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rejectedCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={isUpdating}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Rejeitados ({rejectedCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir itens rejeitados</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir todos os {rejectedCount} itens rejeitados? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onBulkDelete('Ignorado')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir {rejectedCount} itens
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {statusFilter === 'todos' && approvalCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                disabled={isUpdating}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar Em Aprovação ({approvalCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetar itens em aprovação</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir todos os {approvalCount} itens em aprovação? 
                  Esta ação remove itens que ainda não foram processados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onBulkDelete('Em aprovação')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
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