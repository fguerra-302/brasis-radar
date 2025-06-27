
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Settings, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface NewsSource {
  name: string;
  url: string;
  active: boolean;
}

interface KeywordCategory {
  name: string;
  keywords: string[];
  weight: number;
}

const RadarConfig = () => {
  const { toast } = useToast();
  
  const [sources, setSources] = useState<NewsSource[]>([
    { name: 'G1 Nordeste', url: 'https://g1.globo.com/rss/g1/nordeste/', active: true },
    { name: 'UOL Universa', url: 'https://rss.uol.com.br/feed/universa.xml', active: true },
    { name: 'Folha Cotidiano', url: 'https://feeds.folha.uol.com.br/cotidiano/rss091.xml', active: true },
    { name: 'O Globo Cultura', url: 'https://oglobo.globo.com/rss/cultura/', active: true },
    { name: 'Nexo', url: 'https://www.nexojornal.com.br/rss/ultimo', active: true }
  ]);

  const [keywordCategories, setKeywordCategories] = useState<KeywordCategory[]>([
    {
      name: 'Cultura & Identidade',
      keywords: ['música', 'arte', 'cultura', 'festival', 'artista', 'criatividade', 'identidade'],
      weight: 3
    },
    {
      name: 'Brasil Real',
      keywords: ['nordeste', 'norte', 'sul', 'interior', 'periferia', 'comunidade', 'região'],
      weight: 3
    },
    {
      name: 'Diversidade',
      keywords: ['educação', 'jovem', 'mulher', 'negro', 'indígena', 'LGBTQ', 'diversidade'],
      weight: 2
    },
    {
      name: 'Inovação',
      keywords: ['startup', 'empreendedor', 'inovação', 'marca', 'consumo', 'economia'],
      weight: 2
    },
    {
      name: 'Sustentabilidade',
      keywords: ['sustentabilidade', 'meio ambiente', 'clima', 'energia', 'reciclagem'],
      weight: 1
    }
  ]);

  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);

  const addSource = () => {
    if (newSource.name && newSource.url) {
      setSources([...sources, { ...newSource, active: true }]);
      setNewSource({ name: '', url: '' });
      toast({
        title: "✅ Fonte Adicionada",
        description: `${newSource.name} foi adicionada às suas fontes.`,
      });
    }
  };

  const toggleSource = (index: number) => {
    const updated = sources.map((source, i) => 
      i === index ? { ...source, active: !source.active } : source
    );
    setSources(updated);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const updated = [...keywordCategories];
      updated[selectedCategory].keywords.push(newKeyword.trim().toLowerCase());
      setKeywordCategories(updated);
      setNewKeyword('');
      toast({
        title: "✅ Palavra-chave Adicionada",
        description: `"${newKeyword}" foi adicionada à categoria ${keywordCategories[selectedCategory].name}.`,
      });
    }
  };

  const removeKeyword = (categoryIndex: number, keywordIndex: number) => {
    const updated = [...keywordCategories];
    updated[categoryIndex].keywords.splice(keywordIndex, 1);
    setKeywordCategories(updated);
  };

  const updateWeight = (categoryIndex: number, weight: number) => {
    const updated = [...keywordCategories];
    updated[categoryIndex].weight = weight;
    setKeywordCategories(updated);
  };

  const saveConfig = () => {
    // Aqui você salvaria no localStorage ou enviaria para o backend
    localStorage.setItem('radar-sources', JSON.stringify(sources));
    localStorage.setItem('radar-keywords', JSON.stringify(keywordCategories));
    
    toast({
      title: "💾 Configuração Salva",
      description: "Suas preferências foram salvas com sucesso!",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Settings className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-800">Configuração do Radar</h1>
        </div>
        <p className="text-slate-600">Configure suas fontes e palavras-chave para uma curadoria mais efetiva</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fontes de Notícias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">📰 Fontes de Notícias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de fontes */}
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{source.name}</div>
                    <div className="text-sm text-slate-500 truncate">{source.url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={source.active ? "default" : "outline"}
                      onClick={() => toggleSource(index)}
                    >
                      {source.active ? "Ativa" : "Inativa"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSource(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar nova fonte */}
            <div className="space-y-2 pt-4 border-t">
              <Input
                placeholder="Nome da fonte (ex: G1 Bahia)"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              />
              <Input
                placeholder="URL do RSS (ex: https://g1.globo.com/rss/...)"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              />
              <Button onClick={addSource} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fonte
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Palavras-chave */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">🎯 Palavras-chave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {keywordCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-700">{category.name}</h3>
                  <select
                    value={category.weight}
                    onChange={(e) => updateWeight(categoryIndex, parseInt(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value={1}>Peso 1</option>
                    <option value={2}>Peso 2</option>
                    <option value={3}>Peso 3</option>
                  </select>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {category.keywords.map((keyword, keywordIndex) => (
                    <Badge key={keywordIndex} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(categoryIndex, keywordIndex)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}

            {/* Adicionar nova palavra-chave */}
            <div className="space-y-2 pt-4 border-t">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                {keywordCategories.map((category, index) => (
                  <option key={index} value={index}>{category.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova palavra-chave"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salvar configuração */}
      <div className="text-center">
        <Button onClick={saveConfig} size="lg" className="bg-green-600 hover:bg-green-700">
          <Save className="h-5 w-5 mr-2" />
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
};

export default RadarConfig;
