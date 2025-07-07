import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, Copy, Calendar, Tag, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const CuradoriaNewsletter = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [newsletterContent, setNewsletterContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch itens para newsletter
  const { data: items, isLoading } = useQuery({
    queryKey: ['newsletter-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('*')
        .eq('status', 'Para Newsletter')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
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
      queryClient.invalidateQueries({ queryKey: ['newsletter-items'] });
    },
  });

  const generateNewsletterContent = () => {
    const selectedItemsData = items?.filter(item => selectedItems.includes(item.id)) || [];
    
    if (selectedItemsData.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um item para gerar a newsletter.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    let newsletter = `🎯 RADAR BRASIS - ${today}

📍 O Brasil Real em Destaque

Olá! Aqui estão os destaques selecionados para você:

`;

    selectedItemsData.forEach((item, index) => {
      newsletter += `
${index + 1}. ${item.title}

${item.resumo_curado || 'Resumo não disponível'}

📍 Fonte: ${item.source}
🏷️ Editoria: ${item.editoria}
⭐ Relevância: ${item.relevancia}/5

---

`;
    });

    newsletter += `
📧 Este é o Radar Brasis - sua newsletter sobre o Brasil real.

Até a próxima edição!
Equipe Brasis.IA`;

    setNewsletterContent(newsletter);
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleFinishNewsletter = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um item para finalizar a newsletter.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar status dos itens selecionados
      await Promise.all(
        selectedItems.map(itemId =>
          updateItemMutation.mutateAsync({
            id: itemId,
            payload: { 
              status: 'Newsletter Enviada',
              updated_at: new Date().toISOString()
            }
          })
        )
      );

      toast({
        title: "✅ Newsletter Finalizada",
        description: "Newsletter está pronta para publicação no Substack.",
      });
      
      setSelectedItems([]);
      setNewsletterContent('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao finalizar newsletter.",
        variant: "destructive",
      });
    }
  };

  const handleCopyNewsletter = () => {
    navigator.clipboard.writeText(newsletterContent);
    toast({
      title: "✅ Copiado!",
      description: "Conteúdo da newsletter copiado para área de transferência.",
    });
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
    return <div className="flex items-center justify-center p-8">Carregando itens para newsletter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Newsletter Radar Brasis</h1>
          <p className="text-slate-600 mt-1">
            Monte a newsletter para publicação no Substack
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {items?.length || 0} itens disponíveis
          </Badge>
          <Badge variant="outline" className="text-sm">
            {selectedItems.length} selecionados
          </Badge>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={generateNewsletterContent}
          disabled={selectedItems.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Gerar Newsletter
        </Button>

        {newsletterContent && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Visualizar Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Preview da Newsletter</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Textarea
                  value={newsletterContent}
                  onChange={(e) => setNewsletterContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={handleCopyNewsletter}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Conteúdo
                  </Button>
                  
                  <Button 
                    onClick={handleFinishNewsletter}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Newsletter
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => (
          <Card 
            key={item.id} 
            className={`transition-all hover:shadow-md border-l-4 cursor-pointer ${
              selectedItems.includes(item.id) 
                ? 'border-l-green-500 bg-green-50' 
                : 'border-l-blue-500'
            }`}
            onClick={() => handleToggleItem(item.id)}
          >
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
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      Para Newsletter
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(item.pub_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg text-slate-800 leading-tight">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>{item.source}</span>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {item.resumo_curado && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-slate-700">{item.resumo_curado}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedItems.includes(item.id)
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300'
                  }`}>
                    {selectedItems.includes(item.id) && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!items || items.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nenhum item para newsletter
            </h3>
            <p className="text-slate-500 mb-4">
              Não há conteúdos aguardando para serem incluídos na newsletter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};