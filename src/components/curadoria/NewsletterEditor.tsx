import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/BackButton";
import { FileText, Send, Edit3, Calendar, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const NewsletterEditor = () => {
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

  const handleAddToNewsletter = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { 
          status: 'Na Newsletter',
          updated_at: new Date().toISOString()
        }
      });
      toast({
        title: "✅ Adicionado à Newsletter",
        description: "Item foi incluído na próxima edição da newsletter.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar à newsletter.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { status: 'Ignorado' }
      });
      toast({
        title: "Item removido",
        description: "Item foi removido da seleção da newsletter.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover item.",
        variant: "destructive",
      });
    }
  };

  const handleSendToSocial = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { 
          status: 'Para Redes Sociais',
          updated_at: new Date().toISOString()
        }
      });
      toast({
        title: "✅ Enviado para Redes Sociais",
        description: "Item foi enviado para adaptação LinkedIn/Instagram.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar para redes sociais.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando itens da newsletter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/curadoria" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Editor da Newsletter</h1>
            <p className="text-slate-600 mt-1">
              Selecione conteúdos aprovados para compor a newsletter
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {items?.length || 0} itens disponíveis
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => (
          <Card key={item.id} className="transition-all hover:shadow-md border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-800">
                      Relevância {item.relevancia}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.editoria}
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
                    </div>
                  )}

                  {item.resumo_curado && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-slate-700">{item.resumo_curado}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    onClick={() => handleAddToNewsletter(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-sm"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Adicionar à Newsletter
                  </Button>
                  
                  <Button 
                    onClick={() => handleSendToSocial(item)}
                    variant="outline"
                    className="text-sm"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Para Redes Sociais
                  </Button>
                  
                  <Button 
                    onClick={() => handleReject(item)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 text-sm"
                    size="sm"
                  >
                    Remover
                  </Button>
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
              Nenhum item disponível para newsletter
            </h3>
            <p className="text-slate-500 mb-4">
              Não há conteúdos aprovados aguardando seleção para a newsletter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};