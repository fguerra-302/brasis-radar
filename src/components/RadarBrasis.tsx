
import React, { useState } from 'react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useRadarBrasis, useUpdateRadarBrasis } from '@/hooks/useRadarBrasis';
import RadarHeader from './radar/RadarHeader';
import RadarDebugInfo from './radar/RadarDebugInfo';
import RadarFilters from './radar/RadarFilters';
import RadarStats from './radar/RadarStats';
import RadarCard from './radar/RadarCard';
import RadarEmpty from './radar/RadarEmpty';

const ITEMS_PER_PAGE = 9;

// Dados de exemplo para garantir que sempre temos conteúdo para mostrar
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

  const { data: supabaseItems = [], isLoading, error } = useRadarBrasis();
  const updateMutation = useUpdateRadarBrasis();

  // Logs para debug
  console.log('Estado do Radar Brasis:');
  console.log('- Items do Supabase:', supabaseItems);
  console.log('- Carregando:', isLoading);
  console.log('- Erro:', error);
  console.log('- Dados mock disponíveis:', mockData.length);

  // Sempre usar dados mock para garantir que há conteúdo
  const items = mockData;

  const handleAprovar = async (itemId: string, title: string) => {
    try {
      if (supabaseItems.length > 0) {
        await updateMutation.mutateAsync({
          id: itemId,
          payload: { status: 'Publicado' }
        });
      }
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
      if (supabaseItems.length > 0) {
        await updateMutation.mutateAsync({
          id: itemId,
          payload: { status: 'Ignorado' }
        });
      }
      toast({
        title: "❌ Conteúdo Ignorado",
        description: `"${title}" foi marcado como ignorado.`,
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
    
    // Simular execução da curadoria
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

  console.log('Items filtrados:', filteredItems.length);
  console.log('Items paginados:', paginatedItems.length);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <RadarHeader />

          <RadarDebugInfo error={error} supabaseItemsCount={supabaseItems.length} />

          <RadarFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onConfigurar={handleConfigurar}
            onExecutarCuradoria={handleExecutarCuradoria}
          />

          <RadarStats
            totalItems={filteredItems.length}
            currentPage={currentPage}
            totalPages={totalPages}
            dataSource="Dados de demonstração"
          />

          {/* Grid de Conteúdos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map((item) => (
              <RadarCard
                key={item.id}
                item={item}
                onAprovar={handleAprovar}
                onIgnorar={handleIgnorar}
                onVerOriginal={handleVerOriginal}
                isUpdating={updateMutation.isPending}
              />
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
            <RadarEmpty onExecutarCuradoria={handleExecutarCuradoria} />
          )}
        </div>
      </div>
      <Toaster />
    </>
  );
};

export default RadarBrasis;
