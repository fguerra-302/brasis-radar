import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/BackButton";
import { Copy, FileText, Calendar, ExternalLink, Filter } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranding } from '@/hooks/useBranding';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NewsletterExport = () => {
  const [generatedContent, setGeneratedContent] = useState('');
  const [editoriaFilter, setEditoriaFilter] = useState<string>('Todas');
  const [relevanciaFilter, setRelevanciaFilter] = useState<string>('Todas');
  const { toast } = useToast();
  const { brandingConfig } = useBranding();

  // Buscar conteúdos aprovados para newsletter
  const { data: allItems, isLoading } = useQuery({
    queryKey: ['newsletter-approved-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_brasis')
        .select('*')
        .eq('status', 'Para Newsletter')
        .order('relevancia', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Filtrar itens
  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    
    return allItems.filter(item => {
      const editoriaMatch = editoriaFilter === 'Todas' || item.editoria === editoriaFilter;
      const relevanciaMatch = relevanciaFilter === 'Todas' || item.relevancia.toString() === relevanciaFilter;
      
      return editoriaMatch && relevanciaMatch;
    });
  }, [allItems, editoriaFilter, relevanciaFilter]);

  // Lista única de editorias dos itens
  const editorias = useMemo(() => {
    if (!allItems) return [];
    return [...new Set(allItems.map(item => item.editoria))].sort();
  }, [allItems]);

  const generateNewsletterText = () => {
    if (!filteredItems || filteredItems.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há itens aprovados (com os filtros aplicados) para gerar newsletter.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    let content = `🎯 ${brandingConfig.companyName.toUpperCase()} - ${today}\n\n`;
    content += `📍 ${brandingConfig.companyTagline}\n\n`;
    content += `Olá! Aqui estão os destaques selecionados:\n\n`;

    // Agrupar por editoria
    const groupedByEditoria = filteredItems.reduce((groups, item) => {
      const editoria = item.editoria || 'Geral';
      if (!groups[editoria]) {
        groups[editoria] = [];
      }
      groups[editoria].push(item);
      return groups;
    }, {} as Record<string, typeof filteredItems>);

    Object.entries(groupedByEditoria).forEach(([editoria, editoriaItems]) => {
      content += `## ${editoria}\n\n`;
      
      editoriaItems.forEach((item, index) => {
        content += `**${item.title}**\n`;
        if (item.resumo_curado) {
          content += `${item.resumo_curado}\n`;
        }
        content += `📍 Fonte: ${item.source}\n`;
        if (item.link) {
          content += `🔗 [Leia mais](${item.link})\n`;
        }
        content += `\n---\n\n`;
      });
    });

    content += `${brandingConfig.newsletterFooter}\n\n`;
    content += `Até a próxima edição!\n${brandingConfig.newsletterSignature}`;

    setGeneratedContent(content);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast({
        title: "✅ Copiado!",
        description: "Conteúdo da newsletter copiado para área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar conteúdo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando conteúdos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/curadoria" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Exportar Newsletter</h1>
            <p className="text-slate-600 mt-1">
              Conteúdos aprovados prontos para newsletter
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredItems?.length || 0} de {allItems?.length || 0} itens
        </Badge>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por Editoria</label>
              <Select value={editoriaFilter} onValueChange={setEditoriaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as editorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {editorias.map(editoria => (
                    <SelectItem key={editoria} value={editoria}>{editoria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por Relevância</label>
              <Select value={relevanciaFilter} onValueChange={setRelevanciaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as relevâncias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  <SelectItem value="5">5 (Máxima)</SelectItem>
                  <SelectItem value="4">4 (Alta)</SelectItem>
                  <SelectItem value="3">3 (Média)</SelectItem>
                  <SelectItem value="2">2 (Baixa)</SelectItem>
                  <SelectItem value="1">1 (Mínima)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de itens aprovados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Itens Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredItems && filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="border-l-4 border-l-green-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{item.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.source}</span>
                        <Badge variant="outline" className="text-xs">{item.editoria}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          Relevância {item.relevancia}
                        </Badge>
                      </div>
                      {item.resumo_curado && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                          {item.resumo_curado}
                        </p>
                      )}
                    </div>
                    {item.link && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2 flex-shrink-0"
                        onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">
                  {allItems?.length === 0 
                    ? "Nenhum item aprovado para newsletter" 
                    : "Nenhum item corresponde aos filtros aplicados"
                  }
                </p>
              </div>
            )}
            
            <Button 
              onClick={generateNewsletterText}
              className="w-full"
              disabled={!filteredItems || filteredItems.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar Texto da Newsletter
            </Button>
          </CardContent>
        </Card>

        {/* Área de texto gerado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Texto da Newsletter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              placeholder="Clique em 'Gerar Texto da Newsletter' para criar o conteúdo..."
              rows={20}
              className="font-mono text-sm"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={copyToClipboard}
                disabled={!generatedContent}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Texto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};