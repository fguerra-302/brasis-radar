
import React from 'react';
import { Bot, Sparkles, Edit3, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import { UserMenu } from '@/components/UserMenu';
import { useFluxoValidation } from '@/hooks/useFluxoValidation';
import { useBranding } from '@/hooks/useBranding';

const RadarHeader = () => {
  const navigate = useNavigate();
  const { data: validacao, isLoading } = useFluxoValidation();
  const { brandingConfig } = useBranding();
  
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex items-center justify-center gap-4">
        {brandingConfig.logoUrl ? (
          <img 
            src={brandingConfig.logoUrl} 
            alt={`${brandingConfig.companyName} Logo`}
            className="h-12 w-12 object-contain"
          />
        ) : (
          <Bot className="h-10 w-10 text-primary" />
        )}
        <h1 className="text-5xl font-bold text-primary font-brasis">
          {brandingConfig.companyName}
        </h1>
        <Sparkles className="h-10 w-10 text-secondary" />
      </div>
      
      {/* Alertas de Validação */}
      {validacao?.warnings && validacao.warnings.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-2">
          {validacao.warnings.map((warning, index) => (
            <Alert key={index} className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      <div className="relative">
        <div className="absolute inset-0 bg-brasis-beige rounded-2xl"></div>
        <p className="text-xl text-foreground max-w-4xl mx-auto relative z-10 py-6 px-8 font-medium">
          {brandingConfig.companyDescription}
        </p>
      </div>
      <div className="flex justify-center items-center gap-6 pt-6">
        <Button 
          onClick={() => navigate('/curadoria')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg"
        >
          <Edit3 className="h-5 w-5 mr-2" />
          Área de Curadoria
        </Button>
        <Button 
          onClick={() => navigate('/config')}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-6 py-3"
        >
          Configurações
        </Button>
        <div className="ml-4">
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default RadarHeader;
