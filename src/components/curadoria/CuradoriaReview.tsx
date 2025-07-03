import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, ThumbsUp, ThumbsDown, Edit3, Calendar, Tag, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const CuradoriaReview = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [curatedSummary, setCuratedSummary] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch itens para curadoria
  const { data: items, isLoading } = useQuery({
    queryKey: ['curadoria-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('*')
        .eq('status', 'A curar')
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
      queryClient.invalidateQueries({ queryKey: ['curadoria-items'] });
    },
  });

  const handleApprove = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { 
          status: 'Em aprovação',
          resumo_curado: curatedSummary || item.resumo_curado
        }
      });
      toast({
        title: "✅ Item aprovado",
        description: "Item enviado para aprovação final.",
      });
      setSelectedItem(null);
      setCuratedSummary('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aprovar item.",
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
        description: "Item movido para ignorados.",
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
    return <div className="flex items-center justify-center p-8">Carregando itens para curadoria...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Curadoria - Revisão</h1>
          <p className="text-slate-600 mt-1">
            Revise e aprove conteúdos coletados automaticamente
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {items?.length || 0} itens aguardando
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => (
          <Card key={item.id} className="transition-all hover:shadow-md border-l-4 border-l-blue-500">
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

                <div className="flex items-center gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setCuratedSummary(item.resumo_curado || '');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Revisar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">{item.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Fonte:</span> {item.source}
                          </div>
                          <div>
                            <span className="font-medium">Editoria:</span> {item.editoria}
                          </div>
                          <div>
                            <span className="font-medium">Relevância:</span> {item.relevancia}/5
                          </div>
                          <div>
                            <span className="font-medium">Data:</span> {new Date(item.pub_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        {item.input_bruto && (
                          <div>
                            <label className="font-medium text-sm">Conteúdo Original:</label>
                            <div className="bg-gray-50 p-3 rounded-md mt-1 text-sm max-h-40 overflow-y-auto">
                              {item.input_bruto}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="font-medium text-sm">Resumo Curado:</label>
                          <Textarea
                            value={curatedSummary}
                            onChange={(e) => setCuratedSummary(e.target.value)}
                            placeholder="Edite ou crie um resumo curado para este conteúdo..."
                            className="mt-1"
                            rows={4}
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => handleReject(item)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button 
                            onClick={() => handleApprove(item)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Aprovar para Radar
                          </Button>
                        </div>
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
            <Eye className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Nenhum item para revisar
            </h3>
            <p className="text-slate-500 mb-4">
              Todos os itens coletados foram revisados ou não há novos conteúdos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};