import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Edit3, Share2, Video, Linkedin, Instagram, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeString } from '@/lib/inputValidation';

export const CuradoriaEditor = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [socialContent, setSocialContent] = useState({ linkedin: '', instagram: '', video_script: '' });
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['editor-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('radar_brasis').select('*').eq('status', 'Em edição').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data, error } = await supabase.from('radar_brasis').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-items'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });

  const handleGenerateContent = (item: any) => {
    const t = sanitizeString(item.title, 200);
    const s = sanitizeString(item.resumo_curado || item.title, 2000);
    const src = sanitizeString(item.source, 100);
    const ed = sanitizeString(item.editoria, 50);
    setSocialContent({
      linkedin: `🎯 ${t}\n\n${s}\n\n#BrasilReal #Inovação #${ed}\nFonte: ${src}`,
      instagram: `✨ ${t.substring(0, 80)}${t.length > 80 ? '...' : ''}\n\n${s}\n\n#brasil #inovacao #${ed.toLowerCase().replace(/\s+/g, '')}`,
      video_script: `[INTRO]\nOlá! Hoje vamos falar sobre uma descoberta importante.\n\n[DESENVOLVIMENTO]\n${s}\n\n[CALL TO ACTION]\nO que você achou? Comenta aqui!\n\n[FONTE]\n${src}`,
    });
  };

  const handleCopyContent = (content: string, platform: string) => {
    const sanitized = sanitizeString(content, 5000);
    if (!sanitized.trim()) { toast.error("Conteúdo vazio."); return; }
    navigator.clipboard.writeText(sanitized);
    toast.success(`Conteúdo para ${platform} copiado!`);
  };

  const handleFinishEditing = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({ id: item.id, payload: { status: 'Publicado', updated_at: new Date().toISOString() } });
      toast.success("Edição finalizada!");
      setSelectedItem(null);
      setSocialContent({ linkedin: '', instagram: '', video_script: '' });
    } catch { toast.error("Falha ao finalizar edição."); }
  };

  const getRelevanceColor = (relevancia: number) => {
    const colors: Record<number, string> = {
      5: 'bg-destructive/10 text-destructive', 4: 'bg-brasis-terracotta/10 text-brasis-terracotta',
      3: 'bg-accent text-accent-foreground', 2: 'bg-primary/10 text-primary', 1: 'bg-muted text-muted-foreground'
    };
    return colors[relevancia] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) return <div className="flex items-center justify-center p-8 text-muted-foreground">Carregando itens para edição...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Editor para Redes Sociais</h1>
          <p className="text-muted-foreground mt-1">Crie conteúdo otimizado para LinkedIn, Instagram e vídeo</p>
        </div>
        <Badge variant="secondary" className="text-sm">{items?.length || 0} itens para editar</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => (
          <Card key={item.id} className="transition-all hover:shadow-md border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getRelevanceColor(item.relevancia)}>Relevância {item.relevancia}</Badge>
                    <Badge variant="outline" className="text-xs">{item.editoria}</Badge>
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Em edição</Badge>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground leading-tight">{item.title}</h3>
                  {item.resumo_curado && (
                    <div className="bg-muted p-3 rounded-md"><p className="text-sm text-foreground">{item.resumo_curado}</p></div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {item.link && (
                    <Button variant="outline" size="sm" onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="h-4 w-4 mr-1" />Original
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedItem(item); handleGenerateContent(item); }}>
                        <Edit3 className="h-4 w-4 mr-1" />Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">Editar para Redes Sociais</DialogTitle>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                      </DialogHeader>
                      <Tabs defaultValue="linkedin" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="linkedin"><Linkedin className="h-4 w-4 mr-1" />LinkedIn</TabsTrigger>
                          <TabsTrigger value="instagram"><Instagram className="h-4 w-4 mr-1" />Instagram</TabsTrigger>
                          <TabsTrigger value="video"><Video className="h-4 w-4 mr-1" />Vídeo</TabsTrigger>
                        </TabsList>
                        {(['linkedin', 'instagram', 'video_script'] as const).map((key, i) => (
                          <TabsContent key={key} value={key === 'video_script' ? 'video' : key} className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="font-medium text-sm">{['LinkedIn', 'Instagram', 'Roteiro Vídeo'][i]}</label>
                                <Button variant="outline" size="sm" onClick={() => handleCopyContent(socialContent[key], ['LinkedIn', 'Instagram', 'Vídeo'][i])}>
                                  <Copy className="h-4 w-4 mr-1" />Copiar
                                </Button>
                              </div>
                              <Textarea value={socialContent[key]} onChange={e => setSocialContent(prev => ({ ...prev, [key]: e.target.value }))}
                                rows={key === 'video_script' ? 10 : 8} className="font-mono text-sm" />
                              <p className="text-xs text-muted-foreground mt-1">Atual: {socialContent[key].length} caracteres</p>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancelar</Button>
                        <Button onClick={() => handleFinishEditing(item)} className="bg-brasis-sage hover:bg-brasis-sage/90">
                          <CheckCircle className="h-4 w-4 mr-1" />Finalizar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!items || items.length === 0) && (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum item para editar</h3>
            <p className="text-muted-foreground">Vá à <strong>Aprovação</strong> e clique em "Redes Sociais" para enviar itens para edição.</p>
            <Button variant="outline" onClick={() => window.location.href = '/curadoria/approval'} className="mt-2">
              ← Ir à Aprovação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
