
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { useRadarBrasisStats } from '@/hooks/useRadarBrasis';

const RadarLiveStats = () => {
  const { stats, isLoading } = useRadarBrasisStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { title: 'Total Coletado', value: stats.total, icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
    { title: 'Importados', value: stats.imported, icon: AlertCircle, color: 'text-brasis-yellow', bg: 'bg-brasis-yellow/10' },
    { title: 'Em Análise', value: stats.reviewing, icon: Eye, color: 'text-brasis-pink', bg: 'bg-brasis-pink/10' },
    { title: 'Aprovados', value: stats.approved, icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/10' },
    { title: 'Rejeitados', value: stats.rejected, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { title: 'Última Hora', value: stats.ultimaHora, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-foreground">📊 Estatísticas em Tempo Real</h3>
        <Badge variant="outline" className="animate-pulse border-accent text-accent">
          <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
          Ao vivo
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={`${stat.bg} border-0 hover:shadow-md transition-all duration-200`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-card/80">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-sans font-medium">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RadarLiveStats;
