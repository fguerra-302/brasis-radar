
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Bot, Sparkles, Settings, Zap, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';

const ITEMS_PER_PAGE = 9;

const RadarBrasis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const { data: items = [], isLoading, error } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

  const handleAprovar = async (itemId: string, title: string) => {
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        payload: { status: 'Publicado' }
      });
      toast({
        title: "✅ Conteúdo Aprovado",
        description: `"${title}" foi aprovado para publicação.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aprovar conteúdo.",
        variant: "destructive",
      });
    }
  };

  const handleIgnorar = async (itemId: string, title: string) => {
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        payload: { status: 'Ignorado' }
      });
      toast({
        title: "❌ Conteúdo Ignorado",
        description: `"${title}" foi marcado como ignorado.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao ignorar conteúdo.",
        variant: "destructive",
      });
    }
  };

  const handleVerOriginal = (link: string, title: string) => {
    toast({
      title: "🔗 Abrindo Original",
      description: `Abrindo link original de "${title}".`,
    });
    if (link && link !== '#') {
      window.open(link, '_blank');
    }
  };

  const handleConfigurar = () => {
    toast({
      title: "⚙️ Configurações",
      description: "Abrindo painel de configurações...",
    });
  };

  const handleExecutarCuradoria = async () => {
    toast({
      title: "🚀 Curadoria IA Iniciada",
      description: "Executando curadoria automática...",
    });
    
    try {
      const response = await fetch('/api/radar-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast({
          title: "✅ Curadoria Concluída",
          description: "Novos conteúdos foram coletados e analisados!",
        });
      }
    } catch (error) {
      console.log('Curadoria executada localmente');
    }
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

  // Filtros
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mt-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-800">Carregando Radar Brasis...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mt-20">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Erro ao carregar dados</h1>
            <p className="text-slate-600">Tente executar a curadoria IA para popular o banco de dados.</p>
            <Button 
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={handleExecutarCuradoria}
            >
              <Zap className="h-4 w-4 mr-2" />
              Executar Curadoria IA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
                <Button variant="outline" className="flex items-center gap-2" onClick={handleConfigurar}>
                  <Settings className="h-4 w-4" />
                  Configurar
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  onClick={handleExecutarCuradoria}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Executar Curadoria IA
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 flex gap-4 text-sm text-slate-600">
              <span>Total: {filteredItems.length} itens</span>
              <span>Página {currentPage} de {totalPages}</span>
            </div>
          </div>

          {/* Grid de Conteúdos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map((item) => (
              <Card key={item.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500">
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
                      onClick={() => handleAprovar(item.id, item.title)}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aprovar"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleIgnorar(item.id, item.title)}
                      disabled={updateMutation.isPending}
                    >
                      Ignorar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => handleVerOriginal(item.link, item.title)}
                    >
                      Ver Original
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
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => setCurrentPage(index + 1)}
                        isActive={currentPage === index + 1}
                        className="cursor-pointer"
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Empty State quando não há resultados */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                Nenhum conteúdo encontrado
              </h3>
              <p className="text-slate-500 mb-6">
                Execute a curadoria IA para começar a capturar conteúdos relevantes
              </p>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleExecutarCuradoria}
              >
                <Zap className="h-4 w-4 mr-2" />
                Iniciar Curadoria
              </Button>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </>
  );
};

export default RadarBrasis;
