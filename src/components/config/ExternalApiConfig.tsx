import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalApiService } from '@/services/externalApiService';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const ExternalApiConfig = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar URL salva do localStorage
    const savedUrl = localStorage.getItem('external_api_url');
    if (savedUrl) {
      setApiUrl(savedUrl);
      ExternalApiService.setBaseUrl(savedUrl);
      checkConnection(savedUrl);
    }
  }, []);

  const checkConnection = async (url?: string) => {
    setIsChecking(true);
    try {
      if (url) {
        ExternalApiService.setBaseUrl(url);
      }
      const healthy = await ExternalApiService.checkHealth();
      setIsConnected(healthy);
      
      if (!healthy) {
        toast({
          title: "API Externa Indisponível",
          description: "Não foi possível conectar com a API externa",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = () => {
    if (!apiUrl.trim()) {
      toast({
        title: "URL Obrigatória",
        description: "Informe a URL da sua API externa",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(apiUrl); // Validar URL
      localStorage.setItem('external_api_url', apiUrl);
      ExternalApiService.setBaseUrl(apiUrl);
      checkConnection();
      
      toast({
        title: "✅ Configuração Salva",
        description: "URL da API externa configurada com sucesso",
      });
    } catch {
      toast({
        title: "URL Inválida",
        description: "Informe uma URL válida (ex: https://api.exemplo.com)",
        variant: "destructive",
      });
    }
  };

  const handleTest = () => {
    checkConnection();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          API Externa de Scraping
          {isConnected && <Badge variant="secondary" className="text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectada
          </Badge>}
          {!isConnected && apiUrl && <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Desconectada
          </Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-url">URL da API Externa</Label>
          <Input
            id="api-url"
            type="url"
            placeholder="https://sua-api.com"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            URL base da sua API externa que fará o scraping das fontes
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Salvar Configuração
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={isChecking || !apiUrl}
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Testar'
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Endpoints Esperados</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div><code>GET /health</code> - Verificação de saúde</div>
            <div><code>POST /sync-source</code> - Sincronizar uma fonte</div>
            <div><code>POST /test-source</code> - Testar conectividade</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};