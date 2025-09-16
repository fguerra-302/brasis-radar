export interface EditoriaWeightUI {
  id: string;
  name: string;
  color: string;
  multiplier: number;
  description: string;
}

export const defaultEditorialWeights: EditoriaWeightUI[] = [
  {
    id: 'economia',
    name: 'Economia',
    color: 'bg-blue-500',
    multiplier: 1.3,
    description: 'Notícias sobre mercado financeiro, inflação, PIB, política econômica'
  },
  {
    id: 'politica',
    name: 'Política',
    color: 'bg-red-500',
    multiplier: 1.2,
    description: 'Política nacional, eleições, governo federal, congresso'
  },
  {
    id: 'internacional',
    name: 'Internacional',
    color: 'bg-purple-500',
    multiplier: 1.1,
    description: 'Relações internacionais, conflitos, diplomacia, economia global'
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    color: 'bg-green-500',
    multiplier: 1.2,
    description: 'Inovação, startups, inteligência artificial, transformação digital'
  },
  {
    id: 'social',
    name: 'Social',
    color: 'bg-yellow-500',
    multiplier: 1.0,
    description: 'Educação, saúde, direitos humanos, movimentos sociais'
  },
  {
    id: 'meio-ambiente',
    name: 'Meio Ambiente',
    color: 'bg-emerald-500',
    multiplier: 1.4,
    description: 'Sustentabilidade, mudanças climáticas, preservação, energia limpa'
  },
  {
    id: 'cultura',
    name: 'Cultura',
    color: 'bg-pink-500',
    multiplier: 0.8,
    description: 'Arte, música, cinema, literatura, patrimônio cultural'
  },
  {
    id: 'esportes',
    name: 'Esportes',
    color: 'bg-orange-500',
    multiplier: 0.7,
    description: 'Futebol, olimpíadas, competições nacionais e internacionais'
  },
  {
    id: 'geral',
    name: 'Geral',
    color: 'bg-gray-500',
    multiplier: 1.0,
    description: 'Outros assuntos não categorizados especificamente'
  }
];

export const colorOptions = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-teal-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-gray-500'
];