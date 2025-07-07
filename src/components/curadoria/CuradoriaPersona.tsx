import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save, FileText, Wand2, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CuradoriaPersona = () => {
  const [personaData, setPersonaData] = useState({
    name: '',
    tone: 'professional',
    style: 'informative',
    target_audience: '',
    key_values: '',
    communication_style: '',
    examples: ''
  });

  const [testPrompt, setTestPrompt] = useState('');
  const [generatedSample, setGeneratedSample] = useState('');
  const { toast } = useToast();

  const handleSavePersona = () => {
    // Aqui você salvaria a persona no banco de dados
    toast({
      title: "✅ Persona Salva",
      description: "Configurações de persona e estilo foram salvas com sucesso.",
    });
  };

  const handleGenerateSample = () => {
    // Aqui você faria uma chamada para IA gerar um exemplo baseado na persona
    const sample = `[Baseado na persona "${personaData.name}"]

${testPrompt}

Tom: ${personaData.tone}
Estilo: ${personaData.style}
Público-alvo: ${personaData.target_audience}

[Esta seria uma resposta gerada pela IA usando os parâmetros definidos na persona]`;

    setGeneratedSample(sample);
    
    toast({
      title: "✅ Amostra Gerada",
      description: "Exemplo de conteúdo gerado usando a persona configurada.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Persona & Estilo de Escrita</h1>
          <p className="text-slate-600 mt-1">
            Configure a personalidade e estilo para geração de conteúdo customizado
          </p>
        </div>
      </div>

      <Tabs defaultValue="persona" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="persona" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Configurar Persona
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Testar Persona
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Definir Persona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="persona-name">Nome da Persona</Label>
                  <Input
                    id="persona-name"
                    value={personaData.name}
                    onChange={(e) => setPersonaData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Jornalista Brasis, Curador Social..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tom de Voz</Label>
                  <Select value={personaData.tone} onValueChange={(value) => setPersonaData(prev => ({ ...prev, tone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Amigável</SelectItem>
                      <SelectItem value="authoritative">Autoritativo</SelectItem>
                      <SelectItem value="conversational">Conversacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Estilo de Escrita</Label>
                  <Select value={personaData.style} onValueChange={(value) => setPersonaData(prev => ({ ...prev, style: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informative">Informativo</SelectItem>
                      <SelectItem value="analytical">Analítico</SelectItem>
                      <SelectItem value="storytelling">Narrativo</SelectItem>
                      <SelectItem value="concise">Conciso</SelectItem>
                      <SelectItem value="detailed">Detalhado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-audience">Público-Alvo</Label>
                  <Input
                    id="target-audience"
                    value={personaData.target_audience}
                    onChange={(e) => setPersonaData(prev => ({ ...prev, target_audience: e.target.value }))}
                    placeholder="Ex: Profissionais liberais, Empresários, Estudantes..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-values">Valores e Princípios</Label>
                <Textarea
                  id="key-values"
                  value={personaData.key_values}
                  onChange={(e) => setPersonaData(prev => ({ ...prev, key_values: e.target.value }))}
                  placeholder="Descreva os valores e princípios que devem guiar a comunicação..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="communication-style">Estilo de Comunicação</Label>
                <Textarea
                  id="communication-style"
                  value={personaData.communication_style}
                  onChange={(e) => setPersonaData(prev => ({ ...prev, communication_style: e.target.value }))}
                  placeholder="Como essa persona se comunica? Que linguagem usa? Que abordagem prefere?"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examples">Exemplos de Conteúdo</Label>
                <Textarea
                  id="examples"
                  value={personaData.examples}
                  onChange={(e) => setPersonaData(prev => ({ ...prev, examples: e.target.value }))}
                  placeholder="Cole aqui exemplos de posts, textos ou comunicações que representam bem essa persona..."
                  rows={6}
                />
              </div>

              <Button onClick={handleSavePersona} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações de Persona
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Testar Persona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="test-prompt">Prompt de Teste</Label>
                <Textarea
                  id="test-prompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Digite um tópico ou notícia para testar como a persona responderia..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleGenerateSample} 
                disabled={!testPrompt.trim() || !personaData.name}
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar Amostra com Persona
              </Button>

              {generatedSample && (
                <div className="space-y-2">
                  <Label>Amostra Gerada</Label>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700">
                      {generatedSample}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Personas Salvas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Jornalista Brasis</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Tom: Profissional | Estilo: Informativo
                  </p>
                  <p className="text-xs text-slate-500">
                    Foca em análises factuais e contextualização histórica
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Curador Social</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Tom: Conversacional | Estilo: Narrativo
                  </p>
                  <p className="text-xs text-slate-500">
                    Linguagem acessível para redes sociais
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};