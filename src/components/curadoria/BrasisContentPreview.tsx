import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye } from "lucide-react";
import { toast } from "sonner";

interface BrasisContentPreviewProps {
  content: {
    title: string;
    observation: string;
    reflection: string;
    example: string;
    tip: string;
    tags: string[];
  };
}

export const BrasisContentPreview: React.FC<BrasisContentPreviewProps> = ({ content }) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const isEmpty = !content.title && !content.observation && !content.reflection && !content.example && !content.tip;

  if (isEmpty) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed">
        <CardContent className="text-center py-12">
          <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-display text-muted-foreground">Preview do Conteúdo</p>
          <p className="text-sm text-muted-foreground mt-1">Comece criando seu conteúdo para ver o preview aqui</p>
        </CardContent>
      </Card>
    );
  }

  const fullText = [content.title, content.observation, content.reflection, content.example, content.tip]
    .filter(Boolean).join('\n\n');

  return (
    <Card className="h-full overflow-auto">
      <CardContent className="p-6 space-y-6">
        <div className="border-b border-border pb-4">
          {content.title && <h2 className="text-2xl font-display font-bold text-foreground">{content.title}</h2>}
          {content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {content.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {content.observation && (
            <div className="relative group">
              <p className="text-lg italic text-brasis-terracotta font-display leading-relaxed">
                {content.observation}
              </p>
              <Button size="icon" variant="ghost" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                onClick={() => copyToClipboard(content.observation, "Observação")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {content.reflection && (
            <div className="relative group">
              <div className="prose prose-sm text-foreground">
                {content.reflection.split('\n').map((p, i) => p.trim() && <p key={i}>{p}</p>)}
              </div>
              <Button size="icon" variant="ghost" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                onClick={() => copyToClipboard(content.reflection, "Reflexão")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {content.example && (
            <div className="relative group">
              <blockquote className="border-l-4 border-brasis-sage pl-4 py-2 bg-muted/30 rounded-r-md">
                {content.example.split('\n').map((p, i) => p.trim() && <p key={i} className="text-sm text-foreground">{p}</p>)}
              </blockquote>
              <Button size="icon" variant="ghost" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                onClick={() => copyToClipboard(content.example, "Exemplo")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {content.tip && (
            <div className="relative group">
              <p className="text-sm font-medium text-brasis-sage bg-muted/20 p-3 rounded-lg">{content.tip}</p>
              <Button size="icon" variant="ghost" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                onClick={() => copyToClipboard(content.tip, "Dica")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Conteúdo no formato Brasis</span>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(fullText, "Conteúdo completo")}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar Tudo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
