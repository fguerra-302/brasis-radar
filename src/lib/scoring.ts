import { CuratedContent } from '@/types/content';

interface ScoreWeights {
  editoria: Record<string, number>;
  keywords: Record<string, number>;
  source: Record<string, number>;
  recency: number;
}

export class ContentScoring {
  private static weights: ScoreWeights = {
    editoria: {
      'Política': 4,
      'Economia': 4,
      'Tecnologia': 3,
      'Social': 3,
      'Cultura': 2,
      'Regional': 2,
      'Geral': 1
    },
    keywords: {
      'brasil': 3,
      'startup': 2,
      'inovação': 2,
      'sustentabilidade': 2,
      'educação': 2,
      'saúde': 2
    },
    source: {
      'G1': 4,
      'Folha': 4,
      'Estadão': 4,
      'UOL': 3,
      'Exame': 3,
      'TechCrunch': 2
    },
    recency: 0.1
  };

  static calculateScore(content: CuratedContent): number {
    let score = 0;

    // Score por editoria
    score += this.weights.editoria[content.editoria] || 1;

    // Score por tags/keywords
    content.tags.forEach(tag => {
      const keyword = tag.toLowerCase();
      score += this.weights.keywords[keyword] || 0;
    });

    // Score por fonte
    const sourceScore = Object.entries(this.weights.source).find(([source]) => 
      content.source.toLowerCase().includes(source.toLowerCase())
    )?.[1] || 1;
    score += sourceScore;

    // Score por recência (últimas 24h = bonus)
    const hoursOld = this.getHoursOld(content.pub_date);
    if (hoursOld <= 24) {
      score += this.weights.recency * (24 - hoursOld);
    }

    // Score baseado no título (palavras-chave importantes)
    score += this.analyzeTitle(content.title);

    return Math.min(Math.round(score), 5); // Max 5 pontos
  }

  static rankContent(contents: CuratedContent[]): CuratedContent[] {
    return contents
      .map(content => ({
        ...content,
        score: this.calculateScore(content)
      }))
      .sort((a, b) => b.score - a.score);
  }

  private static getHoursOld(pubDate: string): number {
    const now = new Date();
    const published = new Date(pubDate);
    return (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  }

  private static analyzeTitle(title: string): number {
    const importantWords = [
      'exclusivo', 'breaking', 'urgente', 'primeiro',
      'lança', 'anuncia', 'revela', 'descobre',
      'bilhão', 'milhão', 'record', 'histórico',
      'crise', 'boom', 'revolução', 'inovador'
    ];

    let titleScore = 0;
    const lowerTitle = title.toLowerCase();
    
    importantWords.forEach(word => {
      if (lowerTitle.includes(word)) {
        titleScore += 0.5;
      }
    });

    return titleScore;
  }

  static updateWeights(newWeights: Partial<ScoreWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
  }

  static getWeights(): ScoreWeights {
    return { ...this.weights };
  }
}