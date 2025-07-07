import { CuratedContent, ContentStatus } from '@/types/content';

export type ExportFormat = 'csv' | 'json' | 'newsletter' | 'social' | 'canva';

interface ExportOptions {
  format: ExportFormat;
  filters?: {
    status?: ContentStatus[];
    editoria?: string[];
    dateRange?: { start: string; end: string };
  };
}

export class ExportService {
  static async exportContent(contents: CuratedContent[], options: ExportOptions): Promise<string> {
    const filteredContents = this.filterContents(contents, options.filters);

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(filteredContents);
      case 'json':
        return this.exportToJSON(filteredContents);
      case 'newsletter':
        return this.exportToNewsletter(filteredContents);
      case 'social':
        return this.exportToSocial(filteredContents);
      case 'canva':
        return this.exportToCanva(filteredContents);
      default:
        throw new Error(`Formato de export não suportado: ${options.format}`);
    }
  }

  private static filterContents(contents: CuratedContent[], filters?: ExportOptions['filters']): CuratedContent[] {
    if (!filters) return contents;

    return contents.filter(content => {
      if (filters.status && !filters.status.includes(content.status)) {
        return false;
      }

      if (filters.editoria && !filters.editoria.includes(content.editoria)) {
        return false;
      }

      if (filters.dateRange) {
        const contentDate = new Date(content.pub_date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (contentDate < startDate || contentDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }

  private static exportToCSV(contents: CuratedContent[]): string {
    const headers = ['ID', 'Título', 'Editoria', 'Fonte', 'Tags', 'Score', 'Status', 'Data'];
    const rows = contents.map(content => [
      content.id,
      `"${content.title.replace(/"/g, '""')}"`,
      content.editoria,
      content.source,
      `"${content.tags.join(', ')}"`,
      content.score,
      content.status,
      content.pub_date
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private static exportToJSON(contents: CuratedContent[]): string {
    return JSON.stringify(contents, null, 2);
  }

  private static exportToNewsletter(contents: CuratedContent[]): string {
    const approvedContents = contents.filter(c => c.status === ContentStatus.APPROVED);
    const groupedByEditoria = this.groupByEditoria(approvedContents);

    let newsletter = '# Newsletter Brasis\n\n';
    
    Object.entries(groupedByEditoria).forEach(([editoria, items]) => {
      newsletter += `## ${editoria}\n\n`;
      items.forEach(item => {
        newsletter += `### ${item.title}\n`;
        if (item.resumo_curado) {
          newsletter += `${item.resumo_curado}\n`;
        }
        newsletter += `[Leia mais](${item.source_url})\n\n`;
      });
    });

    return newsletter;
  }

  private static exportToSocial(contents: CuratedContent[]): string {
    const socialContents = contents.filter(c => c.status === ContentStatus.APPROVED);
    
    return socialContents.map(content => {
      const hashtags = content.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
      return `📰 ${content.title}\n\n${content.resumo_curado}\n\n${hashtags}\n\n${content.source_url}`;
    }).join('\n\n---\n\n');
  }

  private static exportToCanva(contents: CuratedContent[]): string {
    // Formato específico para templates do Canva
    const canvaData = contents.map(content => ({
      title: content.title,
      subtitle: content.resumo_curado || '',
      category: content.editoria,
      source: content.source,
      url: content.source_url
    }));

    return JSON.stringify(canvaData, null, 2);
  }

  private static groupByEditoria(contents: CuratedContent[]): Record<string, CuratedContent[]> {
    return contents.reduce((groups, content) => {
      const editoria = content.editoria;
      if (!groups[editoria]) {
        groups[editoria] = [];
      }
      groups[editoria].push(content);
      return groups;
    }, {} as Record<string, CuratedContent[]>);
  }

  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}