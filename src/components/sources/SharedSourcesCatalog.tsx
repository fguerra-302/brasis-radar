import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Instagram, Music, BarChart3, Mail, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { useSharedSources, useCreateSharedSource, useDeleteSharedSource } from '@/hooks/useSharedSources';

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'RSS': return <Globe className="h-4 w-4" />;
    case 'INSTAGRAM': return <Instagram className="h-4 w-4" />;
    case 'SPOTIFY': return <Music className="h-4 w-4" />;
    case 'IBGE': return <BarChart3 className="h-4 w-4" />;
    case 'NEWSLETTER': return <Mail className="h-4 w-4" />;
    default: return <Globe className="h-4 w-4" />;
  }
};

const getSourceColor = (type: string) => {
  switch (type) {
    case 'RSS': return 'bg-blue-100 text-blue-800';
    case 'INSTAGRAM': return 'bg-pink-100 text-pink-800';
    case 'SPOTIFY': return 'bg-green-100 text-green-800';
    case 'IBGE': return 'bg-yellow-100 text-yellow-800';
    case 'NEWSLETTER': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const SharedSourcesCatalog = () => {
  const { data: sources = [], isLoading } = useSharedSources();
  const createSource = useCreateSharedSource();
  const deleteSource = useDeleteSharedSource();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'RSS' });

  const filtered = sources.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.url.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newSource.name.trim() || !newSource.url.trim()) return;
    await createSource.mutateAsync(newSource);
    setNewSource({ name: '', url: '', type: 'RSS' });
    setShowAdd(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span>Carregando catálogo...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Catálogo de Fontes
            <Badge variant="secondary">{sources.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Fonte
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Nome"
                value={newSource.name}
                onChange={e => setNewSource({ ...newSource, name: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={newSource.url}
                onChange={e => setNewSource({ ...newSource, url: e.target.value })}
              />
              <select
                value={newSource.type}
                onChange={e => setNewSource({ ...newSource, type: e.target.value })}
                className="p-2 border rounded-md bg-background"
              >
                <option value="RSS">RSS</option>
                <option value="NEWSLETTER">Newsletter</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="SPOTIFY">Spotify</option>
                <option value="IBGE">IBGE</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={createSource.isPending}>
                Adicionar ao Catálogo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fontes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">Nenhuma fonte encontrada.</p>
          ) : (
            filtered.map(source => (
              <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${getSourceColor(source.type)}`}>
                    {getSourceIcon(source.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{source.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{source.url}</div>
                  </div>
                  <Badge variant="outline" className="shrink-0">{source.type}</Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSource.mutate(source.id)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SharedSourcesCatalog;
