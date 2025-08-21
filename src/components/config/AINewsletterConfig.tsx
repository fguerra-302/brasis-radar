import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save, RotateCcw } from "lucide-react";
import { useUserSettings, useUpsertUserSettings } from "@/hooks/useUserSettings";

const DEFAULT_AI_PROMPT = `# Nome do GPT  
Lovable Editor – Texto Corrigido com Storytelling

## 🏆 Missão Principal  
"Você é um editor-chefe de newsletters. Sua função é revisar, corrigir e transformar conteúdos de diferentes editorias em um texto fluido, bem escrito e envolvente. Sua entrega deve manter o que já funciona, aplicar storytelling leve e sair pronta para ser copiada e colada na ferramenta de envio de newsletters."

## 📌 Como você deve atuar  
- **Revise apenas o necessário**: ortografia, gramática, repetição, truncamentos, falhas de coesão.  
- **Mantenha o conteúdo funcional e bem escrito.**  
- Reescreva os resumos com storytelling leve, tornando a leitura mais fluida e conectada.  
- Agrupe os conteúdos por editoria.  
- Para cada editoria:  
  - Comece com uma **frase de abertura que conecte os temas** (como se fosse um microeditorial).  
  - Liste os itens com **bullet points** usando o padrão abaixo.  
  - Finalize com uma **chamada curta de encerramento**.

## 🧩 Formato da saída (texto plano)

**[Nome da Editoria]**  
📌 [Storytelling de introdução com 1 ou 2 frases]  

• **[Título da Notícia 1]** – [Resumo com narrativa fluida e contexto leve]. [Leia mais](link)  
• **[Título da Notícia 2]** – [Resumo com storytelling curto e direto]. [Leia mais](link)

➡️ [Fechamento breve e provocativo que convide à reflexão ou leitura complementar]

(Repita esse bloco para cada editoria presente)

## ⚠️ Restrições  
- Não modifique links ou títulos já corretos.  
- Não use termos promocionais, mantenha uma linguagem editorial.  
- Mantenha o texto **economizado e direto**, sem floreios ou inchaço desnecessário.  
- Evite repetir a mesma estrutura de frase entre os itens. Varie o estilo sutilmente.

## 🛠️ Técnicas aplicadas  
- Correção mínima com impacto máximo  
- Storytelling editorial leve  
- Agrupamento lógico por editoria  
- Adaptação de tom conforme o público informado`;

const EXAMPLE_AUDIENCES = [
  "Profissionais de RH em empresas de médio porte, tom empático e claro, foco em ação e aprendizado prático",
  "Executivos C-level, linguagem objetiva e estratégica, foco em insights de mercado e tendências",
  "Desenvolvedores e tech leads, tom técnico mas acessível, foco em inovação e boas práticas",
  "Gestores de marketing digital, linguagem criativa e analítica, foco em ROI e performance",
  "Empreendedores e startups, tom inspirador e prático, foco em crescimento e oportunidades"
];

export const AINewsletterConfig = () => {
  const { data: userSettings } = useUserSettings();
  const { mutate: upsertSettings } = useUpsertUserSettings();
  const { toast } = useToast();
  
  const [aiPrompt, setAiPrompt] = useState(
    userSettings?.ai_newsletter_prompt || DEFAULT_AI_PROMPT
  );
  const [exampleAudiences, setExampleAudiences] = useState(
    userSettings?.ai_example_audiences?.join('\n') || EXAMPLE_AUDIENCES.join('\n')
  );

  const handleSave = () => {
    const audiencesList = exampleAudiences.split('\n').filter(line => line.trim().length > 0);
    
    upsertSettings({
      ai_newsletter_prompt: aiPrompt,
      ai_example_audiences: audiencesList
    }, {
      onSuccess: () => {
        toast({
          title: "✅ Configurações salvas!",
          description: "Suas configurações de IA foram atualizadas.",
        });
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Falha ao salvar configurações.",
          variant: "destructive",
        });
      }
    });
  };

  const resetToDefault = () => {
    setAiPrompt(DEFAULT_AI_PROMPT);
    setExampleAudiences(EXAMPLE_AUDIENCES.join('\n'));
    toast({
      title: "Resetado",
      description: "Configurações restauradas para o padrão.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Configurações da IA para Newsletter
          </CardTitle>
          <p className="text-sm text-slate-600">
            Personalize como a IA processa e refina suas newsletters
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt personalizado */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Prompt Personalizado da IA
            </label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Digite seu prompt personalizado..."
              rows={15}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              Este prompt define como a IA irá processar e refinar suas newsletters. 
              Inclui instruções de formatação, tom e estrutura.
            </p>
          </div>

          {/* Exemplos de público-alvo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Exemplos de Público-Alvo (um por linha)
            </label>
            <Textarea
              value={exampleAudiences}
              onChange={(e) => setExampleAudiences(e.target.value)}
              placeholder="Digite exemplos de público-alvo..."
              rows={6}
              className="text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              Exemplos que aparecerão como sugestões no campo "Público-Alvo" da newsletter.
              Cada linha será um exemplo diferente.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
            
            <Button onClick={resetToDefault} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de ajuda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Dicas de Personalização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Personalizando o Prompt:</h4>
            <ul className="text-sm text-slate-600 mt-1 space-y-1">
              <li>• Ajuste o tom conforme sua marca (formal, casual, técnico)</li>
              <li>• Defina estruturas específicas para seus tipos de conteúdo</li>
              <li>• Inclua diretrizes de linguagem da sua empresa</li>
              <li>• Especifique formatos de saída preferidos</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm">Público-Alvo Eficaz:</h4>
            <ul className="text-sm text-slate-600 mt-1 space-y-1">
              <li>• Seja específico sobre demografia e função</li>
              <li>• Inclua o tom desejado (empático, técnico, inspirador)</li>
              <li>• Defina objetivos (educar, inspirar, informar)</li>
              <li>• Mencione contexto de negócio quando relevante</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};