import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Calendar, Tag, TrendingUp, Share2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const CuradoriaApproval = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch itens em aprovação
  const { data: items, isLoading } = useQuery({
    queryKey: ['approval-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('*')
        .eq('status', 'Em aprovação')
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
      queryClient.invalidateQueries({ queryKey: ['approval-items'] });
    },
  });

  const handleSendToNewsletter = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { 
          status: 'Para Newsletter',
          updated_at: new Date().toISOString()
        }
      });
      toast({
        title: "✅ Enviado para Newsletter",
        description: "Item foi enviado para a área de edição da Newsletter.",
      });
      // Invalidar também outras queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['newsletter-items'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar para newsletter.",
        variant: "destructive",
      });
    }
  };

  const handleSendToEditor = async (item: any) => {
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
        description: "Item foi enviado para adaptação para LinkedIn e Instagram.",
      });
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['social-media-items'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar para redes sociais.",
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
        title: "Item rejeitado",
        description: "Item foi rejeitado e movido para ignorados.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao rejeitar item.",
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
    return <div className="flex items-center justify-center p-8">Carregando itens para aprovação...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Aprovação & Distribuição</h1>
          <p className="text-slate-600 mt-1">
            Decida o destino final dos conteúdos revisados
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {items?.length || 0} itens aguardando aprovação
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => (
          <Card key={item.id} className="transition-all hover:shadow-md border-l-4 border-l-yellow-500">
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
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      Em Aprovação
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

                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    onClick={() => handleSendToNewsletter(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-sm"
                    size="sm"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Enviar p/ Newsletter
                  </Button>
                  
                  <Button 
                    onClick={() => handleSendToEditor(item)}
                    variant="outline"
                    className="text-sm"
                    size="sm"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Enviar p/ Redes Sociais
                  </Button>
                  
                  <Button 
                    onClick={() => handleReject(item)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 text-sm"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
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
            <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nenhum item aguardando aprovação
            </h3>
            <p className="text-slate-500 mb-4">
              Todos os itens foram processados ou não há conteúdos pendentes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};