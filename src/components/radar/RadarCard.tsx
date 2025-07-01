
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { RadarBrasisItem } from '@/hooks/useRadarBrasis';

interface RadarCardProps {
  item: RadarBrasisItem;
  onAprovar: (id: string, title: string) => Promise<void>;
  onIgnorar: (id: string, title: string) => Promise<void>;
  onVerOriginal: (link: string, title: string) => void;
  isUpdating: boolean;
}

const RadarCard = ({ item, onAprovar, onIgnorar, onVerOriginal, isUpdating }: RadarCardProps) => {
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
      'A curar': 'bg-yellow-100 text-yellow-800',
      'Em aprovação': 'bg-blue-100 text-blue-800',
      'Publicado': 'bg-green-100 text-green-800',
      'Ignorado': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['A curar'];
  };

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold text-slate-800 leading-tight">
            {item.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {item.relevancia && [...Array(item.relevancia)].map((_, i) => (
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
              {item.status}
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
            Ignorar
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1"
            onClick={() => onVerOriginal(item.link, item.title)}
          >
            Ver Original
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RadarCard;
