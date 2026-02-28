
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRadarBrasis } from '@/hooks/useRadarBrasis';

const RadarRecentActions = () => {
  const { data: items } = useRadarBrasis();

  const recentActions = React.useMemo(() => {
    if (!items) return [];
    return items
      .filter(item => item.status !== 'Em aprovação')
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 10);
  }, [items]);

  const getActionIcon = (status: string) => {
    switch (status) {
      case 'Publicado': return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'Ignorado': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'Em aprovação': return <Clock className="h-4 w-4 text-secondary" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Publicado': 'bg-accent/10 text-accent',
      'Ignorado': 'bg-destructive/10 text-destructive',
      'Em aprovação': 'bg-secondary/10 text-secondary'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (recentActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">🕒 Ações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4 font-sans">
            Nenhuma ação realizada ainda. Comece aprovando ou rejeitando itens!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display">🕒 Suas Últimas Decisões</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentActions.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="mt-1">{getActionIcon(item.status)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate font-sans">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1 font-sans">
                {item.source} • {new Date(item.updated_at || item.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <Badge className={getStatusColor(item.status)} variant="secondary">{item.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RadarRecentActions;
