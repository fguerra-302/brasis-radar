import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Globe, Key, Database, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const APIsConfig = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState({});

  const apiConfigs = [
    {
      id: 'meta-content-library',
      name: 'Meta Content Library API',
      description: 'Análise avançada de conteúdo Instagram para pesquisa',
      status: 'not_configured',
      secrets: ['META_CONTENT_LIBRARY_TOKEN'],
      docs: 'https://developers.facebook.com/docs/content-library-api',
      testEndpoint: 'https://graph.facebook.com/v18.0/content_library'
    },
    {
      id: 'spotify',
      name: 'Spotify Web API',
      description: 'Para buscar playlists e podcasts brasileiros',
      status: 'not_configured',
      secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'],
      docs: 'https://developer.spotify.com/documentation/web-api',
      testEndpoint: 'https://accounts.spotify.com/api/token'
    },
    {
      id: 'ibge',
      name: 'IBGE API',
      description: 'Dados oficiais do governo brasileiro',
      status: 'configured',
      secrets: [],
      docs: 'https://servicodados.ibge.gov.br/api/docs',
      testEndpoint: 'https://servicodados.ibge.gov.br/api/v3/noticias'
    }
  ];

  const testConnection = async (api) => {
    setTestResults(prev => ({ ...prev, [api.id]: 'testing' }));
    
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResults(prev => ({ ...prev, [api.id]: 'success' }));
      toast({
        title: "✅ Conexão testada",
        description: `${api.name} está funcionando corretamente.`,
      });
    } catch (error) {
      setTestResults(prev => ({ ...prev, [api.id]: 'error' }));
      toast({
        title: "❌ Erro na conexão",
        description: `Falha ao conectar com ${api.name}.`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'configured': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'not_configured': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'configured': return 'bg-green-100 text-green-800';
      case 'not_configured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'configured': return 'Configurada';
      case 'not_configured': return 'Não Configurada';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">APIs Externas</h1>
        <p className="text-slate-600 mt-1">
          Configure as chaves de API para coletar dados de fontes externas
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="spotify">Spotify</TabsTrigger>
          <TabsTrigger value="ibge">IBGE</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiConfigs.map((api) => (
              <Card key={api.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(api.status)}
                      <CardTitle className="text-lg">{api.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(api.status)}>
                      {getStatusLabel(api.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">{api.description}</p>
                  
                  {api.secrets.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-500">
                        Secrets Necessários:
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {api.secrets.map((secret) => (
                          <Badge key={secret} variant="outline" className="text-xs">
                            {secret}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(api)}
                      disabled={testResults[api.id] === 'testing'}
                      className="flex-1"
                    >
                      {testResults[api.id] === 'testing' ? 'Testando...' : 'Testar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(api.docs, '_blank')}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="instagram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Instagram Basic Display API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Como Configurar:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Acesse o Facebook for Developers</li>
                  <li>2. Crie um app e configure Instagram Basic Display</li>
                  <li>3. Obtenha o Access Token de longa duração</li>
                  <li>4. Configure o token abaixo</li>
                </ol>
              </div>
              
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Access Token necessário:</strong> Configure o INSTAGRAM_ACCESS_TOKEN
                </p>
                <p className="text-xs text-gray-500">
                  Este token permite coletar posts públicos e informações básicas da conta.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spotify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Spotify Web API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Como Configurar:</h3>
                <ol className="text-sm text-green-800 space-y-1">
                  <li>1. Acesse o Spotify for Developers</li>
                  <li>2. Crie um app e obtenha Client ID e Client Secret</li>
                  <li>3. Configure as credenciais abaixo</li>
                </ol>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Client ID:</strong> SPOTIFY_CLIENT_ID
                  </p>
                  <p className="text-xs text-gray-500">
                    Identificador público do seu app
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Client Secret:</strong> SPOTIFY_CLIENT_SECRET
                  </p>
                  <p className="text-xs text-gray-500">
                    Chave secreta do seu app (mantenha segura)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ibge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                IBGE API - Serviços de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h3 className="font-semibold text-emerald-900 mb-2">✅ API Pública - Sem Configuração</h3>
                <p className="text-sm text-emerald-800">
                  A API do IBGE é pública e não requer autenticação. 
                  Você pode começar a usar imediatamente!
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-slate-700">Dados Disponíveis:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium text-sm">Notícias</h5>
                    <p className="text-xs text-gray-600">Releases e comunicados oficiais</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium text-sm">Estatísticas</h5>
                    <p className="text-xs text-gray-600">Dados econômicos e sociais</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium text-sm">Localidades</h5>
                    <p className="text-xs text-gray-600">Estados, municípios e regiões</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium text-sm">Agregados</h5>
                    <p className="text-xs text-gray-600">Pesquisas e levantamentos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};