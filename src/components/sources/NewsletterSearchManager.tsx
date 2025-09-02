import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Search, Loader2, Plus, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { secureApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export const NewsletterSearchManager = () => {
  const [searchTerms, setSearchTerms] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  const searchNewslettersMutation = useMutation({
    mutationFn: async (terms: string) => {
      const data = await secureApi.invokeFunction('newsletter-search', {
        searchTerms: terms
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['curadoria-items'] });
      toast({
        title: "✅ Busca Concluída",
        description: `${data.items_collected} newsletters encontradas sobre "${searchTerms}".`,
      });
    },
    onError: (error: any) => {
      console.error('Erro na busca:', error);
      
      if (error.message?.includes('OPENAI_API_KEY')) {
        toast({
          title: "⚙️ Configuração Necessária",
          description: "API Key do OpenAI não configurada. Configure nas secrets do Supabase.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro na Busca",
          description: error.message || "Falha ao buscar newsletters.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSearch = async () => {
    if (!user) {
      toast({
        title: "Acesso Negado",
        description: "Você precisa estar logado para usar esta funcionalidade.",
        variant: "destructive",
      });
      return;
    }

    if (!searchTerms.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite termos de busca para newsletters.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      await searchNewslettersMutation.mutateAsync(searchTerms);
    } finally {
      setIsSearching(false);
    }
  };

  const quickSearchTerms = [
    'Poder360',
    'Morning Brew Brasil',
    'newsletter brasileira tecnologia',
    'newsletter política brasil',
    'newsletter economia brasil',
    'newsletter startup brasil',
    'newsletter mídia brasil'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pesquisar Newsletters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="text-center text-muted-foreground">
            Carregando autenticação...
          </div>
        )}
        
        {!loading && !user && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">⚠️ Autenticação Necessária:</p>
                <p>
                  Você precisa estar logado para usar a busca de newsletters.
                  Implemente o sistema de login primeiro.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!loading && user && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como funciona a busca de newsletters:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Usa IA para encontrar newsletters brasileiras recentes</li>
                <li>Busca conteúdo publicado nas últimas 2 semanas</li>
                <li>Filtra por relevância e qualidade do conteúdo</li>
                <li>Adiciona automaticamente à curadoria</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Poder360, newsletter tecnologia brasil, morning brew..."
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
              disabled={isSearching}
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchTerms.trim()}
              className="min-w-[120px]"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Buscas rápidas:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickSearchTerms.map((term) => (
                <Badge
                  key={term}
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => setSearchTerms(term)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">✅ Configuração OK:</p>
              <p>
                Esta funcionalidade usa a API do OpenAI que já está configurada no projeto.
              </p>
            </div>
          </div>
        </div>

            {searchNewslettersMutation.data && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  <p className="font-medium">✅ Última busca realizada:</p>
                  <p>Termos: "{searchNewslettersMutation.data.search_terms}"</p>
                  <p>Newsletters encontradas: {searchNewslettersMutation.data.items_collected}</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};