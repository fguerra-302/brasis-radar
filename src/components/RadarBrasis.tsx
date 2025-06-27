import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Zap, Bot, Sparkles, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import RadarConfig from './RadarConfig';

const RadarBrasis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfig, setShowConfig] = useState(false);
  const itemsPerPage = 6;
  
  const { toast } = useToast();
  const { data: items = [], isLoading, refetch } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

  // Filtros
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const executeAutomation = async () => {
    try {
      const response = await fetch('/api/radar-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "🤖 Automação IA Executada",
          description: `Processadas ${result.processedSources} fontes. ${result.curatedItems} itens curados pela IA.`,
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro na Automação",
        description: "Falha ao executar a curadoria automática.",
        variant: "destructive",
      });
    }
  };

  const updateStatus = (id: string, newStatus: string) => {
    updateMutation.mutate({ 
      id, 
      payload: { status: newStatus } 
    });
  };

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

  if (showConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-6">
          <Button
            onClick={() => setShowConfig(false)}
            variant="outline"
            className="mb-6"
          >
            ← Voltar ao Radar
          </Button>
          <RadarConfig />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Radar Brasis
            </h1>
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Newsletter inteligente que acessa múltiplas fontes e faz curadoria automática do Brasil real
          </p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por título, fonte ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="A curar">A curar</SelectItem>
                  <SelectItem value="Em aprovação">Em aprovação</SelectItem>
                  <SelectItem value="Publicado">Publicado</SelectItem>
                  <SelectItem value="Ignorado">Ignorado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfig(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
              
              <Button 
                onClick={executeAutomation}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Executar Curadoria IA
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de Conteúdos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedItems.map((item) => (
            <Card key={item.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg font-semibold text-slate-800 leading-tight line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {[...Array(item.relevancia)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getEditoriaColor(item.editoria)}>
                    {item.editoria}
                  </Badge>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {item.resumo_curado && (
                  <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg">
                    "{item.resumo_curado}"
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    <strong>Fonte:</strong> {item.source}
                  </p>
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
                  {item.status === 'A curar' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(item.id, 'Em aprovação')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(item.id, 'Ignorado')}
                        className="flex-1"
                      >
                        Ignorar
                      </Button>
                    </>
                  )}
                  
                  {item.status === 'Em aprovação' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(item.id, 'Publicado')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Publicar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="flex-1"
                  >
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      Ver Original
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Nenhum conteúdo encontrado
            </h3>
            <p className="text-slate-500 mb-6">
              Execute a curadoria IA para começar a capturar conteúdos relevantes
            </p>
            <Button onClick={executeAutomation} className="bg-indigo-600 hover:bg-indigo-700">
              <Zap className="h-4 w-4 mr-2" />
              Iniciar Curadoria
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarBrasis;
