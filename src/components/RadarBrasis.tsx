import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Bot, Sparkles, Settings, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const RadarBrasis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const { toast } = useToast();

  // Dados mockados para demonstração
  const mockItems = [
    {
      id: '1',
      title: 'Nova tecnologia revoluciona setor energético brasileiro',
      source: 'TechBrasil',
      editoria: 'Negócios',
      status: 'A curar',
      relevancia: 4,
      tags: ['energia', 'tecnologia', 'inovação'],
      resumo_curado: 'Startup brasileira desenvolve solução inovadora para energia solar.',
      link: '#'
    },
    {
      id: '2',
      title: 'Festival de música brasileira atrai milhares de visitantes',
      source: 'Cultura Online',
      editoria: 'Cultura',
      status: 'Em aprovação',
      relevancia: 3,
      tags: ['música', 'festival', 'cultura'],
      resumo_curado: 'Evento celebra a diversidade musical do Brasil.',
      link: '#'
    }
  ];

  const handleAprovar = (itemId: string, title: string) => {
    toast({
      title: "✅ Conteúdo Aprovado",
      description: `"${title}" foi aprovado para publicação.`,
    });
    console.log(`Aprovado item ${itemId}`);
  };

  const handleIgnorar = (itemId: string, title: string) => {
    toast({
      title: "❌ Conteúdo Ignorado",
      description: `"${title}" foi marcado como ignorado.`,
      variant: "destructive",
    });
    console.log(`Ignorado item ${itemId}`);
  };

  const handleVerOriginal = (link: string, title: string) => {
    toast({
      title: "🔗 Abrindo Original",
      description: `Abrindo link original de "${title}".`,
    });
    console.log(`Ver original: ${link}`);
    // Em um caso real, abriria o link
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  const handleConfigurar = () => {
    toast({
      title: "⚙️ Configurações",
      description: "Abrindo painel de configurações...",
    });
    console.log('Abrindo configurações');
  };

  const handleExecutarCuradoria = () => {
    toast({
      title: "🚀 Curadoria IA Iniciada",
      description: "Executando curadoria automática...",
    });
    console.log('Executando curadoria IA');
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

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          </div>

          {/* Grid de Conteúdos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg font-semibold text-slate-800 leading-tight">
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
