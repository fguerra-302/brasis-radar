
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRadarBrasis } from '@/hooks/useRadarBrasis';

const RadarRecentActions = () => {
  const { data: items } = useRadarBrasis();

  // Pega os 10 itens mais recentemente modificados
  const recentActions = React.useMemo(() => {
    if (!items) return [];
    
    return items
      .filter(item => item.status !== 'A curar') // Apenas itens que foram processados
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 10);
  }, [items]);

  const getActionIcon = (status: string) => {
    switch (status) {
      case 'Publicado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Ignorado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Em aprovação':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Publicado': 'bg-green-100 text-green-800',
      'Ignorado': 'bg-red-100 text-red-800',
      'Em aprovação': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (recentActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🕒 Ações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">
            Nenhuma ação realizada ainda. Comece aprovando ou rejeitando itens!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🕒 Suas Últimas Decisões</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentActions.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="mt-1">
              {getActionIcon(item.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {item.source} • {new Date(item.updated_at || item.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <Badge className={getStatusColor(item.status)} variant="secondary">
              {item.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RadarRecentActions;
