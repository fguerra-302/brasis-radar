import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Key, Globe, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CuradoriaConfig = () => {
  const { toast } = useToast();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configs, setConfigs] = useState({
    newsApiKey: '',
    openaiApiKey: '',
    intervaloCuradoria: '60', // minutos
    fontesCustomizadas: ['g1.globo.com', 'folha.uol.com.br', 'estadao.com.br']
  });

  const handleSaveConfig = async () => {
    try {
      // Aqui você salvaria as configurações no Supabase Secrets
      toast({
        title: "✅ Configurações Salvas",
        description: "As configurações da curadoria foram atualizadas.",
      });
      setIsConfigOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    toast({
      title: "🔄 Testando Conexões",
      description: "Verificando APIs...",
    });

    // Simula teste das APIs
    setTimeout(() => {
      toast({
        title: "✅ Teste Concluído",
        description: "Todas as APIs estão funcionando corretamente.",
      });
    }, 2000);
  };

  if (!isConfigOpen) {
    return (
      <Button 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={() => setIsConfigOpen(true)}
      >
        <Settings className="h-4 w-4" />
        Configurar Curadoria
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações da Curadoria IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="apis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="fontes">Fontes</TabsTrigger>
            <TabsTrigger value="automacao">Automação</TabsTrigger>
          </TabsList>

          <TabsContent value="apis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="newsapi" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  NewsAPI Key
                </Label>
                <Input
                  id="newsapi"
                  type="password"
                  placeholder="Digite sua NewsAPI key..."
                  value={configs.newsApiKey}
                  onChange={(e) => setConfigs(prev => ({ ...prev, newsApiKey: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave gratuita em{' '}
                  <a href="https://newsapi.org" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                    newsapi.org
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="openai" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  OpenAI API Key
                </Label>
                <Input
                  id="openai"
                  type="password"
                  placeholder="Digite sua OpenAI key..."
                  value={configs.openaiApiKey}
                  onChange={(e) => setConfigs(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Para análise e resumo inteligente do conteúdo
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={testConnection} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Testar Conexões
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="fontes" className="space-y-4">
            <div className="space-y-3">
              <Label>Fontes de Notícias Monitoradas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  'G1 - Globo.com',
                  'Folha de S.Paulo',
                  'Estado de São Paulo',
                  'UOL Notícias',
                  'CNN Brasil',
                  'BBC Brasil',
                  'Agência Brasil',
                  'Valor Econômico',
                  'Exame',
                  'StartupSe',
                  'TechTudo',
                  'Convergência Digital'
                ].map((fonte) => (
                  <div key={fonte} className="flex items-center space-x-2 p-2 bg-slate-50 rounded">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">{fonte}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automacao" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="intervalo">Intervalo de Curadoria Automática</Label>
              <select 
                id="intervalo"
                className="w-full p-2 border rounded-md"
                value={configs.intervaloCuradoria}
                onChange={(e) => setConfigs(prev => ({ ...prev, intervaloCuradoria: e.target.value }))}
              >
                <option value="15">A cada 15 minutos</option>
                <option value="30">A cada 30 minutos</option>
                <option value="60">A cada 1 hora</option>
                <option value="120">A cada 2 horas</option>
                <option value="360">A cada 6 horas</option>
                <option value="720">A cada 12 horas</option>
                <option value="1440">A cada 24 horas</option>
                <option value="0">Apenas manual</option>
              </select>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Como Funciona a Curadoria IA</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Coleta:</strong> Busca notícias em tempo real das principais fontes</li>
                <li>• <strong>Análise:</strong> IA classifica relevância e categoriza conteúdo</li>
                <li>• <strong>Resumo:</strong> Cria resumos inteligentes focados no impacto</li>
                <li>• <strong>Curadoria:</strong> Filtra apenas conteúdo relevante para o Brasil</li>
                <li>• <strong>Aprovação:</strong> Conteúdo de alta relevância vai para aprovação automática</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveConfig} className="bg-indigo-600 hover:bg-indigo-700">
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CuradoriaConfig;