import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, ChevronLeft, Radar, CheckCircle, FileText, Share2, Lightbulb, Sparkles } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Brasis.IA',
    description: 'Este é o sistema de curadoria inteligente do DNA Brasis. Aqui você coleta, filtra, aprova e transforma conteúdo em newsletters e posts para redes sociais. Vamos conhecer o fluxo!',
    icon: <Sparkles className="h-6 w-6 text-brasis-terracotta" />
  },
  {
    id: 'radar',
    title: '1. Radar — Coleta de Conteúdo',
    description: 'Esta é a tela principal. Clique em "Executar Curadoria" para coletar notícias das suas fontes RSS. Os itens aparecem aqui com nota de relevância. Envie os melhores para aprovação clicando em "Aprovar".',
    icon: <Radar className="h-6 w-6 text-primary" />
  },
  {
    id: 'approval',
    title: '2. Aprovação — Decida o Destino',
    description: 'Em Curadoria > Aprovação, você decide: enviar para Newsletter, para Redes Sociais, ou rejeitar. Cada item aprovado segue para o próximo passo do pipeline.',
    icon: <CheckCircle className="h-6 w-6 text-brasis-sage" />
  },
  {
    id: 'newsletter',
    title: '3. Newsletter — Gere e Refine',
    description: 'Em Curadoria > Newsletter, os itens aprovados viram texto formatado. Clique em "Gerar Texto" e depois "Refinar com IA" para ajustar tom e público-alvo. Copie e envie!',
    icon: <FileText className="h-6 w-6 text-brasis-terracotta" />
  },
  {
    id: 'social',
    title: '4. Redes Sociais & Editor Brasis',
    description: 'Use o Editor Social para criar posts para LinkedIn, Instagram e roteiros de vídeo. O Editor Brasis permite criar conteúdo original no formato editorial de 4 blocos (Observação, Reflexão, Dica, Exemplo).',
    icon: <Share2 className="h-6 w-6 text-primary" />
  },
  {
    id: 'persona',
    title: '5. Persona — Defina seu Tom de Voz',
    description: 'Em Persona & Estilo, configure o tom, estilo e público-alvo da sua comunicação. Use a aba "Testar" para gerar amostras com IA e validar antes de usar na produção.',
    icon: <Lightbulb className="h-6 w-6 text-brasis-yellow" />
  }
];

interface OnboardingTourProps {
  onClose: () => void;
}

export const OnboardingTour = ({ onClose }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
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
      <Card className="w-full max-w-md shadow-2xl border-brasis-terracotta/30">
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
            <CardTitle className="text-xl font-display">{currentTourStep.title}</CardTitle>
          </div>
          
          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full flex-1 ${
                  index <= currentStep ? 'bg-brasis-terracotta' : 'bg-muted'
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
              <Button variant="link" size="sm" className="text-xs text-muted-foreground" onClick={handleSkip}>
                Pular tour
              </Button>
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-brasis-terracotta hover:bg-brasis-terracotta/90"
              >
                {currentStep === tourSteps.length - 1 ? 'Começar!' : 'Próximo'}
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
