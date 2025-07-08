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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRadarSources, useCreateRadarSource, useUpdateRadarSource, useDeleteRadarSource } from '@/hooks/useRadarBrasis';
import { NewsletterSearchManager } from '@/components/sources/NewsletterSearchManager';
import SourceManager from '@/components/sources/SourceManager';
import { SimpleLogin } from '@/components/auth/SimpleLogin';

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
    { value: 'NEWSLETTER', label: 'Newsletter Search', icon: Globe },
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
      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sources">Gerenciar Fontes</TabsTrigger>
          <TabsTrigger value="newsletters">Busca de Newsletters</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <SourceManager />
        </TabsContent>

        <TabsContent value="newsletters">
          <NewsletterSearchManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};