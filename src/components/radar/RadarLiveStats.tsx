
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { useRadarStats } from '@/hooks/useRadarStats';

const RadarLiveStats = () => {
  const { stats, isLoading } = useRadarStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Coletado',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Aguardando',
      value: stats.aCurar,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      title: 'Em Análise',
      value: stats.emAprovacao,
      icon: Eye,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Aprovados',
      value: stats.publicados,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Rejeitados',
      value: stats.ignorados,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Última Hora',
      value: stats.ultimaHora,
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">📊 Estatísticas em Tempo Real</h3>
        <Badge variant="outline" className="animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Ao vivo
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={`${stat.bg} border-0 hover:shadow-md transition-all duration-200`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/80`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-600 font-medium">{stat.title}</p>
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
