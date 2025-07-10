
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Settings, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
              <SelectItem value="Em aprovação">Em aprovação</SelectItem>
              <SelectItem value="Para Newsletter">Para Newsletter</SelectItem>
              <SelectItem value="Na Newsletter">Na Newsletter</SelectItem>
              <SelectItem value="Para Redes Sociais">Para Redes Sociais</SelectItem>
              <SelectItem value="Em edição">Em edição</SelectItem>
              <SelectItem value="Ignorado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => navigate('/config')}
          >
            <Settings className="h-4 w-4" />
            Configurar Fontes
          </Button>
          
          <Button 
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={onExecutarCuradoria}
          >
            <Zap className="h-4 w-4 mr-2" />
            Nova Curadoria
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RadarFilters;
