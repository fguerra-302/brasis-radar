
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Settings, Zap } from 'lucide-react';

interface RadarFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onConfigurar: () => void;
  onExecutarCuradoria: () => void;
}

const RadarFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  onConfigurar, 
  onExecutarCuradoria 
}: RadarFiltersProps) => {
  return (
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
          <Button variant="outline" className="flex items-center gap-2" onClick={onConfigurar}>
            <Settings className="h-4 w-4" />
            Configurar
          </Button>
          
          <Button 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            onClick={onExecutarCuradoria}
          >
            <Zap className="h-4 w-4 mr-2" />
            Executar Curadoria IA
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RadarFilters;
