import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Settings, ExternalLink } from 'lucide-react';
import { useConfigStatus } from '@/hooks/useConfigStatus';

interface ConfigurationAlertProps {
  showOnSuccess?: boolean;
  className?: string;
}

export const ConfigurationAlert = ({ showOnSuccess = false, className = "" }: ConfigurationAlertProps) => {
  const { status, loading } = useConfigStatus();

  if (loading) return null;

  // Show success state only if explicitly requested
  if (status.isConfigured && !showOnSuccess) return null;

  return (
    <Alert className={`${status.isConfigured ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'} ${className}`}>
      {status.isConfigured ? (
        <CheckCircle className="h-4 w-4 text-emerald-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-orange-600" />
      )}
      <AlertDescription className={status.isConfigured ? 'text-emerald-800' : 'text-orange-800'}>
        {status.isConfigured ? (
          <div className="flex items-center justify-between">
            <span>✓ Configuração validada com sucesso!</span>
            <span className="text-xs text-emerald-600">
              Verificado em {status.lastChecked.toLocaleTimeString()}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <strong>⚠️ Configuração do Supabase necessária</strong>
              <p className="text-sm mt-1">
                As URLs de autenticação precisam ser configuradas no Supabase para que o login funcione corretamente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = '/setup'}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                Assistente de Configuração
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/vlsirftmzvmilugalbpr/auth/url-configuration', '_blank')}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Supabase Dashboard
              </Button>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};