
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Search, Settings, Zap, Bot, TrendingUp, Users, Clock, Database } from 'lucide-react';

const ITEMS_PER_PAGE = 9;

// Dados de exemplo
const mockData = [
  {
    id: '1',
    title: 'Startup baiana desenvolve tecnologia sustentável',
    link: 'https://example.com/1',
    source: 'Portal Local BA',
    pub_date: '2024-07-01T10:00:00Z',
    editoria: 'Negócios',
    tags: ['startup', 'sustentabilidade', 'bahia'],
    relevancia: 3,
    status: 'A curar',
    resumo_curado: 'Empresa baiana inova no setor de energia limpa com solução revolucionária.',
    created_at: '2024-07-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Festival de cultura nordestina acontece em Salvador',
    link: 'https://example.com/2',
    source: 'Cultura BA',
    pub_date: '2024-07-01T14:00:00Z',
    editoria: 'Cultura',
    tags: ['festival', 'cultura', 'salvador'],
    relevancia: 2,
    status: 'Em aprovação',
    resumo_curado: 'Evento celebra tradições nordestinas com shows e gastronomia típica.',
    created_at: '2024-07-01T14:00:00Z'
  },
  {
    id: '3',
    title: 'Projeto social transforma comunidade no interior',
    link: 'https://example.com/3',
    source: 'Social Impact',
    pub_date: '2024-07-01T16:00:00Z',
    editoria: 'Social',
    tags: ['projeto social', 'comunidade', 'interior'],
    relevancia: 3,
    status: 'Publicado',
    resumo_curado: 'Iniciativa local promove educação e desenvolvimento econômico.',
    created_at: '2024-07-01T16:00:00Z'
  }
];

const RadarBrasis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const items = mockData;

  const handleAprovar = (itemId: string, title: string) => {
    toast({
      title: "✅ Conteúdo Aprovado",
      description: `"${title}" foi aprovado para publicação.`,
    });
  };

  const handleIgnorar = (itemId: string, title: string) => {
    toast({
      title: "❌ Conteúdo Ignorado",
      description: `"${title}" foi marcado como ignorado.`,
    });
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

  const handleExecutarCuradoria = () => {
    toast({
      title: "🚀 Curadoria IA Iniciada",
      description: "Executando curadoria automática...",
    });
    
    setTimeout(() => {
      toast({
        title: "✅ Curadoria Concluída",
        description: "Novos conteúdos foram coletados e analisados!",
      });
    }, 2000);
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Bot className="h-12 w-12 text-indigo-600" />
              <h1 className="text-4xl font-bold text-slate-800">Radar Brasis</h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Curadoria inteligente de conteúdos que capturam o Brasil real, fora do mainstream
            </p>
          </div>

          {/* Info de Debug */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Info:</strong> Exibindo dados de demonstração ({items.length} itens).
                </p>
              </div>
            </div>
          </div>

          {/* Filtros */}
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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Total de Itens</p>
                  <p className="text-2xl font-bold text-slate-800">{filteredItems.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Página Atual</p>
                  <p className="text-2xl font-bold text-slate-800">{currentPage}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Total de Páginas</p>
                  <p className="text-2xl font-bold text-slate-800">{totalPages}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Fonte</p>
                  <p className="text-lg font-semibold text-slate-800">Demo</p>
                </div>
              </div>
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
                    >
                      Aprovar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleIgnorar(item.id, item.title)}
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

          {/* Estado vazio quando não há resultados filtrados */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                Nenhum conteúdo encontrado
              </h3>
              <p className="text-slate-500 mb-6">
                Tente ajustar os filtros ou execute a curadoria IA para mais conteúdos
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
