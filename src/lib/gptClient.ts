interface GPTResponse {
  tags: string[];
  editoria: string;
  resumo: string;
  relevancia: number;
}

export class GPTClient {
  private static apiKey = process.env.OPENAI_API_KEY;

  static async enhanceContent(title: string, content?: string): Promise<GPTResponse> {
    if (!this.apiKey) {
      console.warn('OpenAI API key não configurada, retornando dados padrão');
      return this.getDefaultResponse(title);
    }

    try {
      const prompt = this.buildPrompt(title, content);
      
      const response = await fetch('/api/ai-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Falha na requisição para GPT');
      }

      const data = await response.json();
      return this.parseGPTResponse(data.generatedText);
    } catch (error) {
      console.error('Erro ao processar com GPT:', error);
      return this.getDefaultResponse(title);
    }
  }

  private static buildPrompt(title: string, content?: string): string {
    return `
Analise este conteúdo jornalístico brasileiro e retorne um JSON com:

Título: ${title}
${content ? `Conteúdo: ${content.substring(0, 500)}...` : ''}

Retorne apenas um JSON válido com:
{
  "tags": ["tag1", "tag2", "tag3"],
  "editoria": "Política|Economia|Culture|Tecnologia|Esportes|Social|Regional|Geral",
  "resumo": "Resumo em 1-2 frases do que é relevante",
  "relevancia": 1-5
}

Critérios de relevância:
5 = Impacto nacional, breaking news
4 = Relevante para o público brasileiro
3 = Interesse regional/setorial
2 = Baixo impacto
1 = Irrelevante
`;
  }

  private static parseGPTResponse(response: string): GPTResponse {
    try {
      // Remove markdown code blocks se existirem
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        tags: parsed.tags || [],
        editoria: parsed.editoria || 'Geral',
        resumo: parsed.resumo || '',
        relevancia: parsed.relevancia || 1
      };
    } catch (error) {
      console.error('Erro ao parsear resposta do GPT:', error);
      return this.getDefaultResponse('');
    }
  }

  private static getDefaultResponse(title: string): GPTResponse {
    // Lógica simples de fallback baseada em palavras-chave
    const lowerTitle = title.toLowerCase();
    
    let editoria = 'Geral';
    let tags: string[] = [];
    let relevancia = 2;

    if (lowerTitle.includes('política') || lowerTitle.includes('governo')) {
      editoria = 'Política';
      tags = ['política'];
      relevancia = 3;
    } else if (lowerTitle.includes('economia') || lowerTitle.includes('mercado')) {
      editoria = 'Economia';
      tags = ['economia'];
      relevancia = 3;
    } else if (lowerTitle.includes('cultura') || lowerTitle.includes('arte')) {
      editoria = 'Cultura';
      tags = ['cultura'];
    } else if (lowerTitle.includes('tecnologia') || lowerTitle.includes('startup')) {
      editoria = 'Tecnologia';
      tags = ['tecnologia'];
      relevancia = 3;
    }

    return {
      tags,
      editoria,
      resumo: `Conteúdo sobre ${editoria.toLowerCase()} identificado automaticamente`,
      relevancia
    };
  }
}