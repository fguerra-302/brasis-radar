import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Settings, Loader2, Globe, Instagram, Music, BarChart3, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { BulkSourceUpload } from './BulkSourceUpload';
import {
  useRadarSources,
  useCreateRadarSource,
  useUpdateRadarSource,
  useDeleteRadarSource
} from '@/hooks/useRadarSources';

interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  credentials?: any;
  config?: any;
}

interface SourceFormData {
  name: string;
  url: string;
  type: string;
  credentials?: {
    access_token?: string;
    client_id?: string;
    client_secret?: string;
  };
  config?: {
    instagram_user_id?: string;
    spotify_market?: string;
    ibge_service?: string;
  };
}

const SourceManager = () => {
  const { toast } = useToast();
  const { data: sources = [], isLoading } = useRadarSources();
  const createSourceMutation = useCreateRadarSource();
  const updateSourceMutation = useUpdateRadarSource();
  const deleteSourceMutation = useDeleteRadarSource();

  const [newSource, setNewSource] = useState<SourceFormData>({
    name: '',
    url: '',
    type: 'RSS'
  });

  const resetForm = () => {
    setNewSource({
      name: '',
      url: '',
      type: 'RSS'
    });
  };

  const addSource = async () => {
    console.log('Tentando adicionar fonte:', newSource);
    
    if (!newSource.name || !newSource.url) {
      console.log('Campos obrigatórios faltando');
      toast({
        title: "Campos obrigatórios",
        description: "Nome e URL são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Chamando createSourceMutation.mutateAsync');
      const result = await createSourceMutation.mutateAsync({
        name: newSource.name,
        url: newSource.url,
        type: newSource.type,
        active: true,
        credentials: newSource.credentials,
        config: newSource.config
      } as any);
      
      console.log('Fonte criada com sucesso:', result);
      resetForm();
      toast({
        title: "✅ Fonte Adicionada",
        description: `${newSource.name} foi adicionada às suas fontes.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar fonte:', error);
      toast({
        title: "Erro",
        description: `Falha ao adicionar fonte: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const toggleSource = async (source: NewsSource) => {
    try {
      await updateSourceMutation.mutateAsync({
        id: source.id,
        payload: { active: !source.active }
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar fonte.",
        variant: "destructive",
      });
    }
  };

  const removeSource = async (id: string) => {
    try {
      await deleteSourceMutation.mutateAsync(id);
      toast({
        title: "✅ Fonte Removida",
        description: "Fonte foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover fonte.",
        variant: "destructive",
      });
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span>Carregando fontes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Fontes de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">Fontes Ativas</TabsTrigger>
              <TabsTrigger value="add">Adicionar Nova</TabsTrigger>
              <TabsTrigger value="bulk">Upload em Massa</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getSourceColor(source.type)}`}>
                        {getSourceIcon(source.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{source.url}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {source.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={source.active ? "default" : "outline"}
                        onClick={() => toggleSource(source)}
                        disabled={updateSourceMutation.isPending}
                      >
                        {source.active ? "Ativa" : "Inativa"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSource(source.id)}
                        disabled={deleteSourceMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Fonte</label>
                  <select
                    value={newSource.type}
                    onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="RSS">RSS Feed</option>
                    <option value="NEWSLETTER">Newsletter Search</option>
                    <option value="INSTAGRAM">Instagram Basic Display</option>
                    <option value="SPOTIFY">Spotify API</option>
                    <option value="IBGE">IBGE API</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Nome da Fonte</label>
                  <Input
                    placeholder="Ex: G1 Bahia, Perfil Instagram, Playlist Regional..."
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    {newSource.type === 'RSS' ? 'URL do RSS' : 
                     newSource.type === 'NEWSLETTER' ? 'Termos de busca para newsletters' :
                     newSource.type === 'INSTAGRAM' ? 'Instagram User ID' :
                     newSource.type === 'SPOTIFY' ? 'Playlist/Album ID' :
                     'IBGE Service Endpoint'}
                  </label>
                  <Input
                    placeholder={
                      newSource.type === 'RSS' ? 'https://g1.globo.com/rss/...' :
                      newSource.type === 'NEWSLETTER' ? 'Ex: Poder360, Morning Brew, newsletter brasileira' :
                      newSource.type === 'INSTAGRAM' ? '12345678901234567' :
                      newSource.type === 'SPOTIFY' ? '37i9dQZF1DX0XUsuxWHRQd' :
                      'https://servicodados.ibge.gov.br/api/v1/...'
                    }
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    className="mt-1"
                  />
                </div>

                {newSource.type !== 'RSS' && newSource.type !== 'NEWSLETTER' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Credenciais Necessárias</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      {newSource.type === 'INSTAGRAM' && 'Será necessário configurar Access Token do Instagram Basic Display API.'}
                      {newSource.type === 'SPOTIFY' && 'Será necessário configurar Client ID e Secret do Spotify.'}
                      {newSource.type === 'IBGE' && 'IBGE API é pública, não precisa de credenciais.'}
                    </p>
                    <p className="text-xs text-yellow-600">
                      As credenciais serão configuradas nas próximas etapas.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={addSource} 
                  className="w-full" 
                  disabled={createSourceMutation.isPending}
                >
                  {createSourceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Adicionar Fonte
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <BulkSourceUpload />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SourceManager;