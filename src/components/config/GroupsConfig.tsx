import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, Edit, Loader2, FolderOpen } from 'lucide-react';
import { useContentGroups, useCreateContentGroup, useUpdateContentGroup, useDeleteContentGroup } from '@/hooks/useContentGroups';
import { useSourceGroupAssignments, useBulkAssignSourcesToGroup } from '@/hooks/useSourceGroupAssignments';
import { useSharedSources } from '@/hooks/useSharedSources';
import type { ContentGroup } from '@/types/content';

export function GroupsConfig() {
  const { data: groups = [], isLoading: loadingGroups } = useContentGroups();
  const { data: sources = [], isLoading: loadingSources } = useSharedSources();
  const { data: allAssignments = [] } = useSourceGroupAssignments();
  
  const createGroup = useCreateContentGroup();
  const updateGroup = useUpdateContentGroup();
  const deleteGroup = useDeleteContentGroup();
  const bulkAssign = useBulkAssignSourcesToGroup();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContentGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    await createGroup.mutateAsync({ name: newGroupName.trim(), description: newGroupDesc.trim() || undefined });
    setNewGroupName('');
    setNewGroupDesc('');
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingGroup || !newGroupName.trim()) return;
    await updateGroup.mutateAsync({ 
      id: editingGroup.id, 
      name: newGroupName.trim(), 
      description: newGroupDesc.trim() || undefined 
    });
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      await deleteGroup.mutateAsync(id);
    }
  };

  const getSourcesForGroup = (groupId: string) => {
    return allAssignments
      .filter(a => a.group_id === groupId)
      .map(a => a.source_id);
  };

  const handleSourceToggle = async (groupId: string, sourceId: string, currentSources: string[]) => {
    const newSources = currentSources.includes(sourceId)
      ? currentSources.filter(id => id !== sourceId)
      : [...currentSources, sourceId];
    
    await bulkAssign.mutateAsync({ sourceIds: newSources, groupId });
  };

  if (loadingGroups || loadingSources) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grupos / Newsletters</h2>
          <p className="text-muted-foreground">
            Organize suas fontes em grupos para diferentes newsletters
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Grupo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Radar Brasis"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Ex: Cultura e comportamento brasileiro"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newGroupName.trim() || createGroup.isPending}>
                {createGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Grupo</Label>
              <Input
                id="edit-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={!newGroupName.trim() || updateGroup.isPending}>
              {updateGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum grupo criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie grupos para organizar suas fontes por newsletter
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {groups.map((group) => {
            const groupSources = getSourcesForGroup(group.id);
            
            return (
              <AccordionItem key={group.id} value={group.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{group.name}</span>
                    <Badge variant="secondary">{groupSources.length} fontes</Badge>
                    {group.description && (
                      <span className="text-sm text-muted-foreground hidden md:inline">
                        — {group.description}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingGroup(group);
                          setNewGroupName(group.name);
                          setNewGroupDesc(group.description || '');
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(group.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Fontes associadas:</h4>
                      <ScrollArea className="h-64 border rounded-md p-3">
                        <div className="space-y-2">
                          {sources.map((source) => (
                            <label
                              key={source.id}
                              className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={groupSources.includes(source.id)}
                                onCheckedChange={() => handleSourceToggle(group.id, source.id, groupSources)}
                              />
                              <span className="flex-1">{source.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {source.type}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
