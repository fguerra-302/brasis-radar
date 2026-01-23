import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/BackButton";
import { Copy, FileText, Calendar, ExternalLink, Filter, Sparkles, Loader2, Undo2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { secureApi } from '@/lib/api';
import { useBranding } from '@/hooks/useBranding';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NewsletterExport = () => {
  const [generatedContent, setGeneratedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [editoriaFilter, setEditoriaFilter] = useState<string>('Todas');
  const [relevanciaFilter, setRelevanciaFilter] = useState<string>('Todas');
  const [isRefining, setIsRefining] = useState(false);
  const [lastRefinementTime, setLastRefinementTime] = useState<number>(0);
  const { toast } = useToast();
  const { brandingConfig } = useBranding();
  const { data: userSettings } = useUserSettings();

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

  const editorias = useMemo(() => {
    if (!allItems) return [];
    return [...new Set(allItems.map(item => item.editoria))].sort();
  }, [allItems]);

  // Lista de sugestões de público-alvo (da configuração do usuário ou padrão)
  const audienceSuggestions = useMemo(() => {
    return userSettings?.ai_example_audiences || [
      "Profissionais de RH em empresas de médio porte, tom empático e claro, foco em ação e aprendizado prático",
      "Executivos C-level, linguagem objetiva e estratégica, foco em insights de mercado e tendências",
      "Desenvolvedores e tech leads, tom técnico mas acessível, foco em inovação e boas práticas",
      "Gestores de marketing digital, linguagem criativa e analítica, foco em ROI e performance",
      "Empreendedores e startups, tom inspirador e prático, foco em crescimento e oportunidades"
    ];
  }, [userSettings]);

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
    setOriginalContent(content);
  };

  const refineWithAI = async () => {
    if (!generatedContent) {
      toast({
        title: "Aviso",
        description: "Gere o texto da newsletter primeiro antes de refinar com IA.",
        variant: "destructive",
      });
      return;
    }

    const now = Date.now();
    if (now - lastRefinementTime < 10000) {
      toast({
        title: "Aguarde",
        description: "Aguarde alguns segundos antes de refinar novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsRefining(true);
    setLastRefinementTime(now);

    try {
      const data = await secureApi.invokeFunction('newsletter-editor', {
        newsletterText: generatedContent,
        publicoAlvo: publicoAlvo.trim() || null,
        // Usa o prompt salvo do usuário automaticamente se disponível
        customPrompt: null // deixa a edge function buscar o prompt salvo
      });

      if (!data) {
        throw new Error('Nenhum dado retornado do refinamento');
      }

      setGeneratedContent(data.refinedText);
      
      toast({
        title: "✨ Newsletter refinada!",
        description: `Texto aprimorado com ${data.promptUsed === 'saved' ? 'seu prompt personalizado' : 'prompt padrão'}.`,
      });

    } catch (error) {
      console.error('❌ Erro no refinamento:', error);
      
      const isSessionExpired = (error as Error)?.message?.includes('Authentication required') ||
                               error?.status === 403 || 
                               error?.message?.includes('JWT');
      
      toast({
        title: "Erro no Refinamento",
        description: isSessionExpired 
          ? "Sua sessão expirou. Faça login novamente." 
          : "Não foi possível refinar o conteúdo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const undoRefinement = () => {
    if (originalContent) {
      setGeneratedContent(originalContent);
      toast({
        title: "Desfeito",
        description: "Texto restaurado para a versão original.",
      });
    }
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
            {/* Campo Público-Alvo com sugestões */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                🎯 Público-Alvo (opcional)
              </label>
              <Textarea
                value={publicoAlvo}
                onChange={(e) => setPublicoAlvo(e.target.value)}
                placeholder="Ex: Profissionais de RH em empresas de médio porte, tom empático e claro, foco em ação e aprendizado prático..."
                rows={3}
                className="text-sm"
              />
              
              {/* Sugestões de público-alvo */}
              {audienceSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-2">Sugestões rápidas:</p>
                  <div className="flex flex-wrap gap-1">
                    {audienceSuggestions.slice(0, 3).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => setPublicoAlvo(suggestion)}
                      >
                        {suggestion.split(',')[0]}...
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-slate-500 mt-1">
                A IA usará {userSettings?.ai_newsletter_prompt ? 'seu prompt personalizado' : 'o prompt padrão'} configurado em Configurações → IA Newsletter
              </p>
            </div>

            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              placeholder="Clique em 'Gerar Texto da Newsletter' para criar o conteúdo..."
              rows={16}
              className="font-mono text-sm"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                onClick={copyToClipboard}
                disabled={!generatedContent}
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Texto
              </Button>

              <Button 
                onClick={refineWithAI}
                disabled={!generatedContent || isRefining}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isRefining ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isRefining ? 'Refinando...' : '🤖 Refinar com IA'}
              </Button>
            </div>

            {originalContent && originalContent !== generatedContent && (
              <Button 
                onClick={undoRefinement}
                variant="ghost"
                size="sm"
                className="w-full text-slate-600"
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Desfazer refinamento (voltar ao original)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
