import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, ChevronLeft, Lightbulb, Settings, Bot } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Brasis.IA',
    description: 'Esta é uma plataforma de curadoria inteligente que monitora múltiplas fontes de conteúdo sobre o Brasil real para criar newsletters personalizadas.',
    icon: <Bot className="h-6 w-6 text-primary" />
  },
  {
    id: 'items',
    title: 'O que são os Itens?',
    description: 'Cada item é uma notícia ou conteúdo coletado automaticamente das suas fontes configuradas. Eles passam por análise de relevância e curadoria antes de serem aprovados.',
    icon: <Lightbulb className="h-6 w-6 text-secondary" />
  },
  {
    id: 'sources',
    title: 'Como Gerenciar Fontes',
    description: 'Vá em Configurações > Fontes para adicionar, editar ou remover fontes RSS, newsletters e redes sociais. Mantenha ativas apenas as fontes relevantes para seu conteúdo.',
    icon: <Settings className="h-6 w-6 text-accent" />
  },
  {
    id: 'training',
    title: 'Treinamento de IA',
    description: 'O sistema aprende com suas aprovações e rejeições. Vá em Configurações > Palavras-chave para definir prioridades e treinar a IA para identificar conteúdo mais relevante.',
    icon: <Bot className="h-6 w-6 text-brasis-yellow" />
  }
];

interface OnboardingTourProps {
  onClose: () => void;
}

export const OnboardingTour = ({ onClose }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Verificar se o tour já foi visto
    const tourCompleted = localStorage.getItem('brasis-tour-completed');
    if (tourCompleted) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('brasis-tour-completed', 'true');
    setIsVisible(false);
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('brasis-tour-completed', 'true');
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            {currentTourStep.icon}
            <CardTitle className="text-xl">{currentTourStep.title}</CardTitle>
          </div>
          
          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full flex-1 ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {currentTourStep.description}
          </p>
          
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} de {tourSteps.length}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {currentStep === tourSteps.length - 1 ? 'Começar' : 'Próximo'}
                {currentStep < tourSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};