import { supabase } from '@/integrations/supabase/client';
import { CuratedContent, ContentStatus, ContentFilters } from '@/types/content';

export class ContentService {
  static async getAllContent(filters?: ContentFilters): Promise<CuratedContent[]> {
    let query = supabase
      .from('radar_brasis')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.editoria) {
      query = query.eq('editoria', filters.editoria);
    }

    if (filters?.searchTerm) {
      query = query.or(`title.ilike.%${filters.searchTerm}%,source.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar conteúdos:', error);
      throw error;
    }

    return this.mapToContent(data || []);
  }

  static async getContentById(id: string): Promise<CuratedContent | null> {
    const { data, error } = await supabase
      .from('radar_brasis')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar conteúdo:', error);
      throw error;
    }

    return data ? this.mapToContent([data])[0] : null;
  }

  static async saveContent(content: Omit<CuratedContent, 'id' | 'created_at'>): Promise<CuratedContent> {
    const { data, error } = await supabase
      .from('radar_brasis')
      .insert({
        title: content.title,
        link: content.source_url,
        source: content.source,
        pub_date: content.pub_date,
        editoria: content.editoria,
        tags: content.tags,
        relevancia: content.score,
        status: content.status,
        resumo_curado: content.resumo_curado,
        input_bruto: content.input_bruto,
        user_id: content.user_id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar conteúdo:', error);
      throw error;
    }

    return this.mapToContent([data])[0];
  }

  static async updateStatus(id: string, status: ContentStatus): Promise<void> {
    const { error } = await supabase
      .from('radar_brasis')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  static async updateContent(id: string, updates: Partial<CuratedContent>): Promise<CuratedContent> {
    const { data, error } = await supabase
      .from('radar_brasis')
      .update({
        title: updates.title,
        editoria: updates.editoria,
        tags: updates.tags,
        relevancia: updates.score,
        status: updates.status,
        resumo_curado: updates.resumo_curado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conteúdo:', error);
      throw error;
    }

    return this.mapToContent([data])[0];
  }

  static async deleteContent(id: string): Promise<void> {
    const { error } = await supabase
      .from('radar_brasis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar conteúdo:', error);
      throw error;
    }
  }

  private static mapToContent(data: any[]): CuratedContent[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      excerpt: item.resumo_curado,
      source_url: item.link,
      tags: item.tags || [],
      editoria: item.editoria,
      score: item.relevancia || 1,
      status: item.status as ContentStatus,
      source: item.source,
      pub_date: item.pub_date,
      resumo_curado: item.resumo_curado,
      input_bruto: item.input_bruto,
      created_at: item.created_at,
      updated_at: item.updated_at,
      user_id: item.user_id
    }));
  }
}