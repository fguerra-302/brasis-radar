import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Database, Edit3, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRadarSources, useCreateRadarSource, useUpdateRadarSource, useDeleteRadarSource } from '@/hooks/useRadarConfig';

export const SourcesConfig = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const { toast } = useToast();
  
  const { data: sources, isLoading } = useRadarSources();
  const createSource = useCreateRadarSource();
  const updateSource = useUpdateRadarSource();
  const deleteSource = useDeleteRadarSource();

  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    type: 'RSS' as const,
    active: true
  });

  const sourceTypes = [
    { value: 'RSS', label: 'RSS Feed', icon: Globe },
    { value: 'INSTAGRAM', label: 'Instagram', icon: Globe },
    { value: 'SPOTIFY', label: 'Spotify', icon: Globe },
    { value: 'IBGE', label: 'IBGE API', icon: Database }
  ];

  const handleCreateSource = async () => {
    try {
      await createSource.mutateAsync(newSource);
      setNewSource({ name: '', url: '', type: 'RSS', active: true });
      setIsAddDialogOpen(false);
      toast({
        title: "✅ Fonte adicionada",
        description: "Nova fonte de dados foi configurada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar fonte de dados.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (source: any) => {
    try {
      await updateSource.mutateAsync({
        id: source.id,
        payload: { active: !source.active }
      });
      toast({
        title: source.active ? "Fonte desativada" : "Fonte ativada",
        description: `${source.name} foi ${source.active ? 'desativada' : 'ativada'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar fonte.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSource = async (source: any) => {
    if (!confirm(`Tem certeza que deseja remover "${source.name}"?`)) return;
    
    try {
      await deleteSource.mutateAsync(source.id);
      toast({
        title: "✅ Fonte removida",
        description: "Fonte de dados foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover fonte.",
        variant: "destructive",
      });
    }
  };

  const getSourceTypeColor = (type: string) => {
    const colors = {
      'RSS': 'bg-orange-100 text-orange-800',
      'INSTAGRAM': 'bg-pink-100 text-pink-800',
      'SPOTIFY': 'bg-green-100 text-green-800',
      'IBGE': 'bg-blue-100 text-blue-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando fontes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fontes de Dados</h1>
          <p className="text-slate-600 mt-1">
            Configure e gerencie as fontes de onde o sistema coleta informações
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Adicionar Fonte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Fonte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Fonte</Label>
                <Input
                  id="name"
                  value={newSource.name}
                  onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Portal G1"
                />
              </div>
              
              <div>
                <Label htmlFor="url">URL/Endpoint</Label>
                <Input
                  id="url"
                  value={newSource.url}
                  onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Ex: https://g1.globo.com/rss/"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo da Fonte</Label>
                <Select
                  value={newSource.type}
                  onValueChange={(value) => setNewSource(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newSource.active}
                  onCheckedChange={(checked) => setNewSource(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Ativar imediatamente</Label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSource} disabled={!newSource.name || !newSource.url}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sources?.map((source) => (
          <Card key={source.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${source.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Database className={`h-4 w-4 ${source.active ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{source.name}</h3>
                      <p className="text-sm text-slate-600 truncate max-w-md">{source.url}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getSourceTypeColor(source.type)}>
                      {source.type}
                    </Badge>
                    {source.active ? (
                      <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={source.active}
                    onCheckedChange={() => handleToggleActive(source)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSource(source)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSource(source)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!sources || sources.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nenhuma fonte configurada
            </h3>
            <p className="text-slate-500 mb-4">
              Adicione suas primeiras fontes de dados para começar a curadoria
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Fonte
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};