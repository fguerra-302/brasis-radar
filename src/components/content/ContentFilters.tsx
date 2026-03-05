

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Settings, Zap, RefreshCw, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContentGroups } from '@/hooks/useContentGroups';

interface RadarFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  groupFilter?: string;
  setGroupFilter?: (groupId: string) => void;
  onConfigurar: () => void;
  onExecutarCuradoria: () => void;
  onRecalcularRelevancia?: () => void;
}

const RadarFilters = ({ 
  searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  groupFilter, setGroupFilter,
  onConfigurar, onExecutarCuradoria, onRecalcularRelevancia
}: RadarFiltersProps) => {
  const navigate = useNavigate();
  const { data: groups } = useContentGroups();

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Buscar por título, fonte ou tags..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 font-sans" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 font-sans">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Coletado">Coletado</SelectItem>
              <SelectItem value="Em aprovação">Em aprovação</SelectItem>
              <SelectItem value="selecionados">Selecionados (Curadoria)</SelectItem>
              <SelectItem value="Para Newsletter">Para Newsletter</SelectItem>
              <SelectItem value="Em edição">Em edição</SelectItem>
              <SelectItem value="Publicado">Publicado</SelectItem>
              <SelectItem value="Ignorado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
          {setGroupFilter && groups && groups.length > 0 && (
            <Select value={groupFilter || 'todos'} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full md:w-52 font-sans">
                <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os grupos</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2">
          {onRecalcularRelevancia && (
            <Button variant="outline" className="flex items-center gap-2 font-sans" onClick={onRecalcularRelevancia}>
              <RefreshCw className="h-4 w-4" />
              Recalcular Relevância
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2 font-sans" onClick={() => navigate('/config')}>
            <Settings className="h-4 w-4" />
            Configurar Fontes
          </Button>
          <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-sans" onClick={onExecutarCuradoria}>
            <Zap className="h-4 w-4 mr-2" />
            Nova Curadoria
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RadarFilters;
