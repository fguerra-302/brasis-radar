import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BrasisContentItem {
  id: string;
  title: string;
  observation: string;
  reflection: string | null;
  example: string | null;
  tip: string | null;
  tags: string[];
  created_at: string;
}

export const BrasisLibrary = () => {
  const [items, setItems] = useState<BrasisContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('brasis_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar conteúdos");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => item.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.observation.toLowerCase().includes(search.toLowerCase());
      const matchTag = !activeTag || item.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [items, search, activeTag]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
    const { error } = await supabase.from('brasis_content').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Conteúdo excluído");
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando biblioteca...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título ou observação..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={!activeTag ? "default" : "outline"} className="cursor-pointer"
            onClick={() => setActiveTag(null)}>Todas</Badge>
          {allTags.map(tag => (
            <Badge key={tag} variant={activeTag === tag ? "default" : "outline"}
              className="cursor-pointer" onClick={() => setActiveTag(tag === activeTag ? null : tag)}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum conteúdo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-display line-clamp-2">{item.title}</CardTitle>
                  <Button size="icon" variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                    onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags?.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                  ))}
                  {(item.tags?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{item.tags.length - 3}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{item.observation}</p>
                <p className="text-xs text-muted-foreground/60 mt-3">
                  {format(new Date(item.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
