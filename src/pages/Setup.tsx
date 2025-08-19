import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ExternalLink, Copy, AlertTriangle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Setup = () => {
  const { toast } = useToast();
  const [authUrls, setAuthUrls] = useState({
    siteUrl: '',
    redirectUrls: [] as string[]
  });
  const [authConfig, setAuthConfig] = useState({
    emailConfirmation: true,
    isConfigured: false
  });

  useEffect(() => {
    // Detect current environment URLs
    const currentUrl = window.location.origin;
    const isLocalhost = currentUrl.includes('localhost');
    const isLovable = currentUrl.includes('lovable.app');
    
    const suggestions = [currentUrl];
    if (isLocalhost) {
      suggestions.push('http://localhost:5173', 'http://localhost:3000');
    }
    
    setAuthUrls({
      siteUrl: currentUrl,
      redirectUrls: suggestions
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "URL copiada para área de transferência",
    });
  };

  const testAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        toast({
          title: "✅ Autenticação OK",
          description: "Sistema configurado corretamente!",
        });
        setAuthConfig(prev => ({ ...prev, isConfigured: true }));
      } else {
        toast({
          title: "⚠️ Teste pendente",
          description: "Faça login para testar a configuração",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro de configuração",
        description: "Verifique as URLs no Supabase",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Assistente de Configuração</h1>
          <p className="text-muted-foreground">
            Configure a autenticação do Supabase em 2 passos simples
          </p>
        </div>

        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status da Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {authConfig.isConfigured ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Pendente
                </Badge>
              )}
              <Button onClick={testAuth} size="sm" variant="outline">
                Testar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Passo 1: URLs de Autenticação */}
        <Card>
          <CardHeader>
            <CardTitle>
              Passo 1: Configure as URLs de Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Abra o link abaixo e configure as URLs exatamente como mostrado aqui
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Site URL:</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                    {authUrls.siteUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(authUrls.siteUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Redirect URLs (adicione todas):</label>
                <div className="space-y-2 mt-1">
                  {authUrls.redirectUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                        {url}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => window.open(`https://supabase.com/dashboard/project/vlsirftmzvmilugalbpr/auth/url-configuration`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Configuração de URLs no Supabase
            </Button>
          </CardContent>
        </Card>

        {/* Passo 2: Configuração de Email */}
        <Card>
          <CardHeader>
            <CardTitle>
              Passo 2: Configure a Confirmação de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Para Testes:</strong> Desabilite "Confirm email"
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Login imediato, sem confirmação
                  </span>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Para Produção:</strong> Habilite "Confirm email"
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Mais seguro, requer confirmação por email
                  </span>
                </AlertDescription>
              </Alert>
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.open(`https://supabase.com/dashboard/project/vlsirftmzvmilugalbpr/auth/providers`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Configuração de Providers no Supabase
            </Button>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card>
          <CardHeader>
            <CardTitle>Após a Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Depois de configurar no Supabase, clique em "Testar Configuração" acima.
                Se tudo estiver OK, seu sistema estará pronto para Go Live! 🚀
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={() => window.location.href = '/auth'}>
                Ir para Login
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Voltar ao Radar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;