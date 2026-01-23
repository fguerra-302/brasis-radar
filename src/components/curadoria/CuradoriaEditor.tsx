import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Edit3, Share2, Video, Camera, Linkedin, Instagram, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeString } from '@/lib/inputValidation';

export const CuradoriaEditor = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [socialContent, setSocialContent] = useState({
    linkedin: '',
    instagram: '',
    video_script: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch itens em edição
  const { data: items, isLoading } = useQuery({
    queryKey: ['editor-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('*')
        .eq('status', 'Em edição')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  type Item = {
    id: string;
    [key: string]: any;
  };

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { [key: string]: string | Date } }) => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-items'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    },
  });

  const handleGenerateContent = (item: Item) => {
    // Sanitize all input data before generating content
    const sanitizedTitle = sanitizeString(item.title, 200);
    const sanitizedSummary = sanitizeString(item.resumo_curado || item.title, 2000);
    const sanitizedSource = sanitizeString(item.source, 100);
    const sanitizedEditoria = sanitizeString(item.editoria, 50);
    
    const linkedinPost = `🎯 ${sanitizedTitle}

${sanitizedSummary}

#BrasilReal #Inovação #${sanitizedEditoria}
Fonte: ${sanitizedSource}`;

    const instagramPost = `✨ ${sanitizedTitle.substring(0, 80)}${sanitizedTitle.length > 80 ? '...' : ''}

${sanitizedSummary}

#brasil #inovacao #${sanitizedEditoria.toLowerCase().replace(/\s+/g, '')}`;

    const videoScript = `[INTRO]
Olá! Hoje vamos falar sobre uma descoberta importante.

[DESENVOLVIMENTO]
${sanitizedSummary}

[CALL TO ACTION]
O que você achou dessa informação? Comenta aqui embaixo!

[FONTE]
Informação da ${sanitizedSource}`;

    setSocialContent({
      linkedin: linkedinPost,
      instagram: instagramPost,
      video_script: videoScript
    });
  };

  const handleCopyContent = (content: string, platform: string) => {
    // Sanitize content before copying
    const sanitizedContent = sanitizeString(content, 5000);
    
    if (sanitizedContent.trim().length === 0) {
      toast({
        title: "Erro",
        description: "Conteúdo inválido ou vazio.",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(sanitizedContent);
    toast({
      title: "✅ Copiado!",
      description: `Conteúdo para ${platform} copiado para a área de transferência.`,
    });
  };

  const handleFinishEditing = async (item: Item) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { 
          status: 'Redes Sociais Publicado',
          updated_at: new Date().toISOString()
        }
      });
      toast({
        title: "✅ Edição Finalizada",
        description: "Item está pronto para distribuição nas redes sociais.",
      });
      setSelectedItem(null);
      setSocialContent({ linkedin: '', instagram: '', video_script: '' });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao finalizar edição.",
        variant: "destructive",
      });
    }
  };

  const getRelevanceColor = (relevancia: number) => {
    const colors = {
      5: 'bg-red-100 text-red-800',
      4: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      2: 'bg-blue-100 text-blue-800',
      1: 'bg-gray-100 text-gray-800'
    };
    return colors[relevancia] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando itens para edição...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editor para Redes Sociais</h1>
          <p className="text-slate-600 mt-1">
            Crie conteúdo otimizado para LinkedIn, Instagram e roteiros de vídeo
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {items?.length || 0} itens para editar
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => (
          <Card key={item.id} className="transition-all hover:shadow-md border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getRelevanceColor(item.relevancia)}>
                      Relevância {item.relevancia}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.editoria}
                    </Badge>
                     <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                       Em edição
                     </Badge>
                  </div>

                  <h3 className="font-semibold text-lg text-slate-800 leading-tight">
                    {item.title}
                  </h3>

                  {item.resumo_curado && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-slate-700">{item.resumo_curado}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {item.link && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Ver Original
                    </Button>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          handleGenerateContent(item);
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">Editar para Redes Sociais</DialogTitle>
                        <p className="text-sm text-slate-600">{item.title}</p>
                      </DialogHeader>
                      
                      <Tabs defaultValue="linkedin" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="linkedin" className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </TabsTrigger>
                          <TabsTrigger value="instagram" className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            Instagram
                          </TabsTrigger>
                          <TabsTrigger value="video" className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Roteiro Vídeo
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="linkedin" className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm">Post para LinkedIn</label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCopyContent(socialContent.linkedin, 'LinkedIn')}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar
                              </Button>
                            </div>
                            <Textarea
                              value={socialContent.linkedin}
                              onChange={(e) => setSocialContent(prev => ({ ...prev, linkedin: e.target.value }))}
                              placeholder="Conteúdo para LinkedIn..."
                              rows={8}
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Máximo 3000 caracteres • Atual: {socialContent.linkedin.length}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="instagram" className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm">Post para Instagram</label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCopyContent(socialContent.instagram, 'Instagram')}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar
                              </Button>
                            </div>
                            <Textarea
                              value={socialContent.instagram}
                              onChange={(e) => setSocialContent(prev => ({ ...prev, instagram: e.target.value }))}
                              placeholder="Conteúdo para Instagram..."
                              rows={8}
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Máximo 2200 caracteres • Atual: {socialContent.instagram.length}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="video" className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm">Roteiro para Vídeo</label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCopyContent(socialContent.video_script, 'Roteiro de Vídeo')}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar
                              </Button>
                            </div>
                            <Textarea
                              value={socialContent.video_script}
                              onChange={(e) => setSocialContent(prev => ({ ...prev, video_script: e.target.value }))}
                              placeholder="Roteiro para vídeo..."
                              rows={10}
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Estrutura: Intro → Desenvolvimento → Call to Action → Fonte
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedItem(null)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={() => handleFinishEditing(item)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Finalizar Edição
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
          <CardContent>
            <Share2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nenhum item para editar
            </h3>
            <p className="text-slate-500 mb-4">
              Não há conteúdos aguardando edição para redes sociais
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};