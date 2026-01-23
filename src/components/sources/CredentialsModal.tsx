import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Key, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CredentialsModalProps {
  source: {
    id: string;
    name: string;
    type: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasCredentials: boolean | null;
}

interface CredentialFields {
  access_token?: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
  source,
  isOpen,
  onClose,
  onSuccess,
  hasCredentials
}) => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<CredentialFields>({});
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setCredentials({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getRequiredFields = (type: string): Array<{ key: keyof CredentialFields; label: string; placeholder: string; description?: string }> => {
    switch (type) {
      case 'INSTAGRAM':
        return [
          {
            key: 'access_token',
            label: 'Access Token',
            placeholder: 'IGQVJYdGxHbW...',
            description: 'Token do Instagram Basic Display API. Válido por 60 dias.'
          }
        ];
      case 'SPOTIFY':
        return [
          {
            key: 'client_id',
            label: 'Client ID',
            placeholder: '1234567890abcdef1234567890abcdef',
            description: 'ID público da aplicação Spotify'
          },
          {
            key: 'client_secret',
            label: 'Client Secret',
            placeholder: 'abcdef1234567890abcdef1234567890',
            description: 'Chave secreta da aplicação Spotify'
          }
        ];
      default:
        return [];
    }
  };

  const validateCredentials = (): boolean => {
    const requiredFields = getRequiredFields(source.type);
    
    for (const field of requiredFields) {
      const value = credentials[field.key];
      if (!value || value.trim().length < 10) {
        toast({
          title: "Campo inválido",
          description: `${field.label} deve ter pelo menos 10 caracteres.`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateCredentials()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Clean credentials object - remove empty values
      const cleanCredentials = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) => value && value.trim())
      );

      const { error } = await supabase.rpc('update_source_credentials', {
        source_id: source.id,
        new_credentials: cleanCredentials
      });

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Credenciais configuradas",
        description: "As credenciais foram salvas com segurança.",
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      toast({
        title: "Erro ao salvar credenciais",
        description: (error as Error).message || "Falha ao configurar credenciais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requiredFields = getRequiredFields(source.type);

  if (requiredFields.length === 0) {
    return null; // Não exibe modal para tipos que não precisam de credenciais
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configurar Credenciais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {source.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {source.type}
                </Badge>
                {hasCredentials && (
                  <Badge variant="secondary" className="text-xs">
                    Credenciais configuradas
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Segurança das Credenciais</p>
                <p>As credenciais são criptografadas e armazenadas com segurança. Nunca são exibidas após serem salvas.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {requiredFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type="password"
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    [field.key]: e.target.value
                  })}
                  className="font-mono text-sm"
                />
                {field.description && (
                  <p className="text-xs text-muted-foreground">
                    {field.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Salvar Credenciais
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CredentialsModal;