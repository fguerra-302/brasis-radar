import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Save, FileText, Wand2, Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PersonaData {
  name: string;
  tone: string;
  style: string;
  target_audience: string;
  key_values: string;
  communication_style: string;
  examples: string;
}

const emptyPersona: PersonaData = {
  name: '', tone: 'professional', style: 'informative',
  target_audience: '', key_values: '', communication_style: '', examples: ''
};

export const CuradoriaPersona = () => {
  const [personaData, setPersonaData] = useState<PersonaData>(emptyPersona);
  const [testPrompt, setTestPrompt] = useState('');
  const [generatedSample, setGeneratedSample] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: personas, isLoading } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PersonaData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Login necessário');

      if (editingId) {
        const { error } = await supabase.from('personas').update({
          name: data.name, tone: data.tone, style: data.style,
          target_audience: data.target_audience || null,
          key_values: data.key_values || null,
          communication_style: data.communication_style || null,
          examples: data.examples || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('personas').insert({
          user_id: user.id, name: data.name, tone: data.tone, style: data.style,
          target_audience: data.target_audience || null,
          key_values: data.key_values || null,
          communication_style: data.communication_style || null,
          examples: data.examples || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      toast.success(editingId ? "Persona atualizada!" : "Persona salva!");
      setPersonaData(emptyPersona);
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      toast.success("Persona excluída");
    },
  });

  const handleSave = () => {
    if (!personaData.name.trim()) { toast.error("Nome é obrigatório"); return; }
    saveMutation.mutate(personaData);
  };

  const handleEdit = (persona: any) => {
    setEditingId(persona.id);
    setPersonaData({
      name: persona.name, tone: persona.tone, style: persona.style,
      target_audience: persona.target_audience || '',
      key_values: persona.key_values || '',
      communication_style: persona.communication_style || '',
      examples: persona.examples || '',
    });
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSample = async () => {
    if (!testPrompt.trim() || !personaData.name) return;
    setIsGenerating(true);
    setGeneratedSample('');
    try {
      const { data, error } = await supabase.functions.invoke('persona-sample', {
        body: { persona: personaData, prompt: testPrompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedSample(data.sample);
      toast.success("Amostra gerada com IA!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar amostra");
    } finally {
      setIsGenerating(false);
    }
  };

  const toneLabels: Record<string, string> = {
    professional: 'Profissional', casual: 'Casual', friendly: 'Amigável',
    authoritative: 'Autoritativo', conversational: 'Conversacional'
  };
  const styleLabels: Record<string, string> = {
    informative: 'Informativo', analytical: 'Analítico', storytelling: 'Narrativo',
    concise: 'Conciso', detailed: 'Detalhado'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Persona & Estilo de Escrita</h1>
        <p className="text-muted-foreground mt-1">Configure a personalidade e estilo para geração de conteúdo</p>
      </div>

      <Tabs defaultValue="persona" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="persona"><User className="h-4 w-4 mr-1.5" />Configurar</TabsTrigger>
          <TabsTrigger value="test"><Wand2 className="h-4 w-4 mr-1.5" />Testar</TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />{editingId ? 'Editar' : 'Nova'} Persona</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome da Persona</Label>
                  <Input value={personaData.name} onChange={e => setPersonaData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Jornalista Brasis..." />
                </div>
                <div className="space-y-2">
                  <Label>Tom de Voz</Label>
                  <Select value={personaData.tone} onValueChange={v => setPersonaData(p => ({ ...p, tone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(toneLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estilo de Escrita</Label>
                  <Select value={personaData.style} onValueChange={v => setPersonaData(p => ({ ...p, style: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(styleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Público-Alvo</Label>
                  <Input value={personaData.target_audience} onChange={e => setPersonaData(p => ({ ...p, target_audience: e.target.value }))} placeholder="Ex: Profissionais liberais..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valores e Princípios</Label>
                <Textarea value={personaData.key_values} onChange={e => setPersonaData(p => ({ ...p, key_values: e.target.value }))} placeholder="Valores que guiam a comunicação..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Estilo de Comunicação</Label>
                <Textarea value={personaData.communication_style} onChange={e => setPersonaData(p => ({ ...p, communication_style: e.target.value }))} placeholder="Como essa persona se comunica?" rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Exemplos de Conteúdo</Label>
                <Textarea value={personaData.examples} onChange={e => setPersonaData(p => ({ ...p, examples: e.target.value }))} placeholder="Exemplos que representam essa persona..." rows={6} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-brasis-terracotta hover:bg-brasis-terracotta/90">
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {editingId ? 'Atualizar' : 'Salvar'} Persona
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={() => { setEditingId(null); setPersonaData(emptyPersona); }}>Cancelar</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personas Salvas */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Personas Salvas</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personas && personas.length > 0 ? personas.map((p: any) => (
                    <div key={p.id} className="p-4 border rounded-lg hover:border-brasis-terracotta/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="cursor-pointer flex-1" onClick={() => handleEdit(p)}>
                          <h3 className="font-semibold text-foreground">{p.name}</h3>
                          <p className="text-sm text-muted-foreground">Tom: {toneLabels[p.tone] || p.tone} | Estilo: {styleLabels[p.style] || p.style}</p>
                          {p.target_audience && <p className="text-xs text-muted-foreground mt-1">{p.target_audience}</p>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground col-span-2 text-center py-4">Nenhuma persona salva ainda</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5" />Testar Persona</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Persona selector */}
              {personas && personas.length > 0 && (
                <div className="space-y-2">
                  <Label>Selecionar Persona Salva</Label>
                  <Select onValueChange={(id) => {
                    const p = personas.find((x: any) => x.id === id);
                    if (p) handleEdit(p);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Escolha uma persona salva..." /></SelectTrigger>
                    <SelectContent>
                      {personas.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({toneLabels[p.tone] || p.tone})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {personaData.name && (
                <div className="bg-muted/50 p-3 rounded-lg border text-sm">
                  <p className="font-medium text-foreground">Persona ativa: {personaData.name}</p>
                  <p className="text-muted-foreground">Tom: {toneLabels[personaData.tone] || personaData.tone} · Estilo: {styleLabels[personaData.style] || personaData.style}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Prompt de Teste</Label>
                <Textarea value={testPrompt} onChange={e => setTestPrompt(e.target.value)} placeholder="Digite um tópico para testar..." rows={4} />
              </div>
              <Button onClick={handleGenerateSample} disabled={!testPrompt.trim() || !personaData.name || isGenerating} className="w-full bg-brasis-terracotta hover:bg-brasis-terracotta/90">
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                {isGenerating ? 'Gerando com IA...' : 'Gerar Amostra com IA'}
              </Button>
              {generatedSample && (
                <div className="space-y-2">
                  <Label>Amostra Gerada</Label>
                  <div className="bg-muted p-4 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{generatedSample}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
