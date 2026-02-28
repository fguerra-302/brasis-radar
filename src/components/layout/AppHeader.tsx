
import React from 'react';
import { Sparkles, Edit3, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import { UserMenu } from '@/components/UserMenu';
import { useFluxoValidation } from '@/hooks/useFluxoValidation';
import { useBranding } from '@/hooks/useBranding';
import { ConfigurationAlert } from '@/components/ConfigurationAlert';
import brasIsLogo from '@/assets/BRASIS_AZUL.png';

const RadarHeader = () => {
  const navigate = useNavigate();
  const { data: validacao, isLoading } = useFluxoValidation();
  const { brandingConfig } = useBranding();
  
  return (
    <div className="text-center space-y-6 py-10">
      {/* Hero Title */}
      <div className="flex items-center justify-center gap-5">
        <img 
          src={brandingConfig.logoUrl || brasIsLogo} 
          alt={`${brandingConfig.companyName} Logo`}
          className="h-16 w-auto object-contain"
        />
        <h1 className="text-5xl font-black tracking-tight font-display text-secondary">
          {brandingConfig.companyName}
        </h1>
      </div>
      
      {/* Configuration Status Alert */}
      <div className="max-w-4xl mx-auto">
        <ConfigurationAlert showOnSuccess={true} />
      </div>
      
      {/* Alertas de Validação */}
      {validacao?.warnings && validacao.warnings.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-2 mt-4">
          {validacao.warnings.map((warning, index) => (
            <Alert key={index} className="border-primary/30 bg-primary/5">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {/* Description Card */}
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl py-6 px-8 border border-border shadow-sm">
          <p className="text-lg text-foreground font-sans font-medium leading-relaxed">
            {brandingConfig.companyDescription}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
        <Button 
          onClick={() => navigate('/curadoria')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl border-0 shadow-md"
        >
          <Edit3 className="h-5 w-5 mr-2" />
          Área de Curadoria
        </Button>
        <Button 
          onClick={() => navigate('/config')}
          variant="outline"
          className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-semibold px-6 py-3 rounded-xl"
        >
          Configurações
        </Button>
        <Button 
          onClick={() => navigate('/config/sources')}
          variant="outline"
          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold px-6 py-3 rounded-xl"
        >
          Adicionar Fontes
        </Button>
        <div className="ml-2">
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default RadarHeader;
