import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderOpen, Plus, Trash2, ChevronRight, ChevronDown, Globe, Instagram, Music, BarChart3, Mail, X, Loader2 } from 'lucide-react';
import { useProjectFolders, useCreateProjectFolder, useDeleteProjectFolder } from '@/hooks/useProjectFolders';
import { useProjectSourceLinks, useAddSourceToFolder, useRemoveSourceFromFolder } from '@/hooks/useProjectSourceLinks';
import { useSharedSources, SharedSource } from '@/hooks/useSharedSources';

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

interface FolderDetailProps {
  folderId: string;
  folderName: string;
  allSources: SharedSource[];
}

const FolderDetail = ({ folderId, folderName, allSources }: FolderDetailProps) => {
  const { data: links = [], isLoading } = useProjectSourceLinks(folderId);
  const addSource = useAddSourceToFolder();
  const removeSource = useRemoveSourceFromFolder();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const linkedSourceIds = new Set(links.map(l => l.source_id));
  const linkedSources = allSources.filter(s => linkedSourceIds.has(s.id));
  const availableSources = allSources.filter(s => !linkedSourceIds.has(s.id));
  const filteredAvailable = availableSources.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

  return (
    <div className="space-y-3 pl-6 border-l-2 border-muted">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {linkedSources.length} fonte(s) nesta pasta
        </span>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Adicionar do Catálogo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar fontes a "{folderName}"</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Buscar fontes disponíveis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  {availableSources.length === 0 ? 'Todas as fontes já estão nesta pasta.' : 'Nenhuma fonte encontrada.'}
                </p>
              ) : (
                filteredAvailable.map(source => (
                  <div key={source.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getSourceColor(source.type)}`}>
                        {getSourceIcon(source.type)}
                      </div>
                      <span className="text-sm">{source.name}</span>
                      <Badge variant="outline" className="text-xs">{source.type}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addSource.mutate({ folderId, sourceId: source.id })}
                      disabled={addSource.isPending}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {linkedSources.map(source => (
        <div key={source.id} className="flex items-center justify-between p-2 border rounded-lg bg-card">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${getSourceColor(source.type)}`}>
              {getSourceIcon(source.type)}
            </div>
            <span className="text-sm font-medium">{source.name}</span>
            <Badge variant="outline" className="text-xs">{source.type}</Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeSource.mutate({ folderId, sourceId: source.id })}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

const ProjectFoldersManager = () => {
  const { data: folders = [], isLoading } = useProjectFolders();
  const { data: allSources = [] } = useSharedSources();
  const createFolder = useCreateProjectFolder();
  const deleteFolder = useDeleteProjectFolder();
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    await createFolder.mutateAsync({ name: newFolderName, description: newFolderDesc });
    setNewFolderName('');
    setNewFolderDesc('');
    setShowAdd(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span>Carregando pastas...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Meus Projetos
            <Badge variant="secondary">{folders.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Pasta
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <Input
              placeholder="Nome da pasta/projeto"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newFolderDesc}
              onChange={e => setNewFolderDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={createFolder.isPending}>
                Criar Pasta
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {folders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma pasta de projeto criada.</p>
            <p className="text-sm">Crie pastas para organizar as fontes por projeto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {folders.map(folder => {
              const isExpanded = expandedFolder === folder.id;
              return (
                <div key={folder.id} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedFolder(isExpanded ? null : folder.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">{folder.name}</span>
                      {folder.description && (
                        <span className="text-sm text-muted-foreground">— {folder.description}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Remover pasta "${folder.name}"?`)) {
                          deleteFolder.mutate(folder.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="p-3 pt-0">
                      <FolderDetail
                        folderId={folder.id}
                        folderName={folder.name}
                        allSources={allSources}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectFoldersManager;
