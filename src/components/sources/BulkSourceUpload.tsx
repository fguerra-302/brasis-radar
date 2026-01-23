import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Loader2, FileText, AlertCircle } from 'lucide-react';
import { useCreateRadarSource } from '@/hooks/useRadarSources';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkSourceData {
  name: string;
  url: string;
  type: 'RSS' | 'NEWSLETTER' | 'INSTAGRAM' | 'SPOTIFY' | 'IBGE';
}

export const BulkSourceUpload = () => {
  const { toast } = useToast();
  const createSourceMutation = useCreateRadarSource();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const template = [
      { name: "G1 Bahia", url: "https://g1.globo.com/ba/bahia/rss/", type: "RSS" },
      { name: "Correio 24 Horas", url: "https://www.correio24horas.com.br/rss", type: "RSS" },
      { name: "Newsletters Brasileiras", url: "newsletter brasileira, economia, política", type: "NEWSLETTER" }
    ];

    const csv = [
      "name,url,type",
      ...template.map(item => `"${item.name}","${item.url}","${item.type}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-fontes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): BulkSourceData[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    
    const nameIndex = headers.indexOf('name');
    const urlIndex = headers.indexOf('url');
    const typeIndex = headers.indexOf('type');

    if (nameIndex === -1 || urlIndex === -1 || typeIndex === -1) {
      throw new Error('CSV deve conter colunas: name, url, type');
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < 3) {
        throw new Error(`Linha ${index + 2}: formato inválido`);
      }

      const type = values[typeIndex].toUpperCase();
      if (!['RSS', 'NEWSLETTER', 'INSTAGRAM', 'SPOTIFY', 'IBGE'].includes(type)) {
        throw new Error(`Linha ${index + 2}: tipo '${type}' inválido`);
      }

      return {
        name: values[nameIndex],
        url: values[urlIndex],
        type: type as BulkSourceData['type']
      };
    }).filter(item => item.name && item.url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const text = await file.text();
      const sources = parseCSV(text);

      if (sources.length === 0) {
        throw new Error('Nenhuma fonte válida encontrada no arquivo');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const source of sources) {
        try {
          await createSourceMutation.mutateAsync({
            name: source.name,
            url: source.url,
            type: source.type,
            active: true
          });
          successCount++;
        } catch (error) {
          errors.push(`${source.name}: ${(error as Error).message || 'Erro desconhecido'}`);
        }
      }

      setResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "✅ Upload concluído",
          description: `${successCount} fontes adicionadas com sucesso.`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "⚠️ Alguns erros ocorreram",
          description: `${errors.length} fontes não puderam ser adicionadas.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Erro no upload",
        description: (error as Error).message || "Erro ao processar arquivo",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload em Massa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Adicione múltiplas fontes de uma vez usando um arquivo CSV.
          </p>

          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Template CSV
          </Button>

          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="cursor-pointer"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato CSV esperado:</strong>
              <br />
              • Colunas: name, url, type
              • Tipos suportados: RSS, NEWSLETTER, INSTAGRAM, SPOTIFY, IBGE
              • Use aspas duplas para valores com vírgulas
            </AlertDescription>
          </Alert>

          {results && (
            <Alert variant={results.errors.length > 0 ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Resultado do upload:</strong></p>
                  <p>✅ {results.success} fontes adicionadas com sucesso</p>
                  {results.errors.length > 0 && (
                    <div>
                      <p>❌ {results.errors.length} erros:</p>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                        {results.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {results.errors.length > 5 && (
                          <li>... e mais {results.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};