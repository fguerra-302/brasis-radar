import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Calendar, Tag, TrendingUp, Share2, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const CuradoriaApproval = () => {
  const queryClient = useQueryClient();

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
        .from('radar_brasis').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-items'] });
    },
  });

  const handleSendToNewsletter = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({ id: item.id, payload: { status: 'Para Newsletter', updated_at: new Date().toISOString() } });
      toast.success("Enviado para Newsletter");
      queryClient.invalidateQueries({ queryKey: ['newsletter-items'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    } catch { toast.error("Falha ao enviar para newsletter."); }
  };

  const handleSendToEditor = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({ id: item.id, payload: { status: 'Em edição', updated_at: new Date().toISOString() } });
      toast.success("Enviado para Redes Sociais");
      queryClient.invalidateQueries({ queryKey: ['social-media-items'] });
      queryClient.invalidateQueries({ queryKey: ['radar-brasis'] });
    } catch { toast.error("Falha ao enviar para redes sociais."); }
  };

  const handleReject = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({ id: item.id, payload: { status: 'Ignorado' } });
      toast.success("Item rejeitado");
    } catch { toast.error("Falha ao rejeitar item."); }
  };

  const getRelevanceColor = (relevancia: number) => {
    const colors: Record<number, string> = {
      5: 'bg-destructive/10 text-destructive',
      4: 'bg-brasis-terracotta/10 text-brasis-terracotta',
      3: 'bg-accent text-accent-foreground',
      2: 'bg-primary/10 text-primary',
      1: 'bg-muted text-muted-foreground'
    };
    return colors[relevancia] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) return <div className="flex items-center justify-center p-8 text-muted-foreground">Carregando itens para aprovação...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Aprovação & Distribuição</h1>
          <p className="text-muted-foreground mt-1">Decida o destino final dos conteúdos revisados</p>
        </div>
        <Badge variant="secondary" className="text-sm">{items?.length || 0} itens aguardando</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => (
          <Card key={item.id} className="transition-all hover:shadow-md border-l-4 border-l-brasis-terracotta">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getRelevanceColor(item.relevancia)}>Relevância {item.relevancia}</Badge>
                    <Badge variant="outline" className="text-xs">{item.editoria}</Badge>
                    <Badge variant="secondary" className="text-xs bg-brasis-terracotta/10 text-brasis-terracotta">Em Aprovação</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(item.pub_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /><span>{item.source}</span>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs"><Tag className="h-3 w-3 mr-1" />{tag}</Badge>
                      ))}
                      {item.tags.length > 3 && <Badge variant="secondary" className="text-xs">+{item.tags.length - 3}</Badge>}
                    </div>
                  )}
                  {item.resumo_curado && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-foreground">{item.resumo_curado}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button onClick={() => handleSendToNewsletter(item)} className="bg-primary hover:bg-primary/90 text-sm" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />Newsletter
                  </Button>
                  <Button onClick={() => handleSendToEditor(item)} variant="outline" className="text-sm" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />Redes Sociais
                  </Button>
                  {item.link && (
                    <Button variant="outline" className="text-sm" size="sm" onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="h-4 w-4 mr-1" />Original
                    </Button>
                  )}
                  <Button onClick={() => handleReject(item)} variant="outline" className="text-destructive hover:text-destructive text-sm" size="sm">
                    <XCircle className="h-4 w-4 mr-1" />Rejeitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!items || items.length === 0) && (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum item aguardando aprovação</h3>
            <p className="text-muted-foreground">Vá ao <strong>Radar</strong> e clique em "Aprovar" nos itens relevantes para enviá-los para cá.</p>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="mt-2">
              ← Ir ao Radar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
