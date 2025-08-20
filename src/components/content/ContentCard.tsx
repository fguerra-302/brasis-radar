
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical, Trash2, RotateCcw } from 'lucide-react';
import { RadarBrasisItem } from '@/hooks/useRadarBrasis';
import { ContentStatus } from '@/types/content';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
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

interface RadarCardProps {
  item: RadarBrasisItem;
  onAprovar: (id: string, title: string) => Promise<void>;
  onIgnorar: (id: string, title: string) => Promise<void>;
  onVerOriginal: (sourceUrl: string, title: string) => void;
  onUpdateStatus: (id: string, status: string, title: string) => Promise<void>;
  onDeleteItem: (id: string, title: string) => Promise<void>;
  isUpdating: boolean;
}

const RadarCard = ({ item, onAprovar, onIgnorar, onVerOriginal, onUpdateStatus, onDeleteItem, isUpdating }: RadarCardProps) => {
  const getEditoriaColor = (editoria: string) => {
    const colors = {
      'Cultura': 'bg-purple-100 text-purple-800',
      'Social': 'bg-blue-100 text-blue-800',
      'Negócios': 'bg-green-100 text-green-800',
      'Sustentabilidade': 'bg-emerald-100 text-emerald-800',
      'Regional': 'bg-orange-100 text-orange-800',
      'Geral': 'bg-gray-100 text-gray-800'
    };
    return colors[editoria] || colors['Geral'];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      [ContentStatus.FOR_NEWSLETTER]: 'bg-green-100 text-green-800',
      [ContentStatus.FOR_SOCIAL]: 'bg-purple-100 text-purple-800',
      [ContentStatus.IN_NEWSLETTER]: 'bg-blue-100 text-blue-800',
      [ContentStatus.IN_EDITING]: 'bg-orange-100 text-orange-800',
      [ContentStatus.REJECTED]: 'bg-red-100 text-red-800',
      'Em aprovação': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors['Em aprovação'];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      [ContentStatus.FOR_NEWSLETTER]: 'Para Newsletter',
      [ContentStatus.FOR_SOCIAL]: 'Para Redes Sociais',
      [ContentStatus.IN_NEWSLETTER]: 'Na Newsletter',
      [ContentStatus.IN_EDITING]: 'Em edição',
      [ContentStatus.REJECTED]: 'Rejeitado',
      'Em aprovação': 'Em aprovação'
    };
    return labels[status] || status;
  };

  const statusOptions = [
    { value: 'Em aprovação', label: 'Em aprovação' },
    { value: ContentStatus.FOR_NEWSLETTER, label: 'Para Newsletter' },
    { value: ContentStatus.FOR_SOCIAL, label: 'Para Redes Sociais' },
    { value: ContentStatus.IN_NEWSLETTER, label: 'Na Newsletter' },
    { value: ContentStatus.IN_EDITING, label: 'Em edição' },
    { value: ContentStatus.REJECTED, label: 'Rejeitado' },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg font-semibold text-slate-800 leading-tight">
                {item.title}
              </CardTitle>
              <div className="flex items-center gap-1">
                {item.score && [...Array(item.score)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {item.editoria && (
                <Badge className={getEditoriaColor(item.editoria)}>
                  {item.editoria}
                </Badge>
              )}
              {item.status && (
                <Badge className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {item.resumo_curado && (
              <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg">
                "{item.resumo_curado}"
              </p>
            )}

            <div className="space-y-2">
              {item.source && (
                <p className="text-xs text-slate-500">
                  <strong>Fonte:</strong> {item.source}
                </p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button 
                size="sm" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => onAprovar(item.id, item.title)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aprovar"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => onIgnorar(item.id, item.title)}
                disabled={isUpdating}
              >
                Rejeitar
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="flex-1"
                onClick={() => onVerOriginal(item.source_url, item.title)}
              >
                Ver Original
              </Button>
              
              {(item.status === 'Ignorado' || item.status === 'Em aprovação') && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={isUpdating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir permanentemente este item? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDeleteItem(item.id, item.title)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem className="font-medium text-slate-600 cursor-default">
          Alterar Status
        </ContextMenuItem>
        <ContextMenuSeparator />
        {statusOptions.map((option) => (
          <ContextMenuItem
            key={option.value}
            onClick={() => onUpdateStatus(item.id, option.value, item.title)}
            disabled={isUpdating || item.status === option.value}
            className={item.status === option.value ? "bg-slate-100 text-slate-500" : ""}
          >
            {option.label}
            {item.status === option.value && " ✓"}
          </ContextMenuItem>
        ))}
        
        <ContextMenuSeparator />
        
        {(item.status === 'Para Newsletter' || item.status === 'Para Redes Sociais' || 
          item.status === 'Para Newsletter e Redes' || item.status === 'Na Newsletter' || 
          item.status === 'Em edição') && (
          <ContextMenuItem
            onClick={() => onUpdateStatus(item.id, 'Em aprovação', item.title)}
            disabled={isUpdating}
            className="text-orange-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Remover da Seleção
          </ContextMenuItem>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <ContextMenuItem
              onSelect={(e) => e.preventDefault()}
              disabled={isUpdating}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Permanentemente
            </ContextMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir item</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir permanentemente "{item.title}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDeleteItem(item.id, item.title)}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default RadarCard;
