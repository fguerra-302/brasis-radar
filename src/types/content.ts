export enum ContentStatus {
  // Fluxo simplificado: Coletado → Em aprovação → Editor escolhe destino
  COLLECTED = "Coletado",
  REVIEWING = "Em aprovação", 
  FOR_NEWSLETTER = "Para Newsletter",
  FOR_SOCIAL = "Para Redes Sociais",
  FOR_BOTH = "Para Newsletter e Redes",
  REJECTED = "Ignorado",
  // Legacy para compatibilidade
  IMPORTED = "Coletado",
  PUBLISHED = "Publicado"
}

export type CuratedContent = {
  id: string;
  title: string;
  excerpt?: string;
  source_url: string;
  tags: string[];
  territory?: string;
  editoria: string;
  score: number;
  status: ContentStatus;
  source: string;
  pub_date: string;
  resumo_curado?: string;
  input_bruto?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

export type ContentFilters = {
  status?: ContentStatus;
  editoria?: string;
  tags?: string[];
  searchTerm?: string;
}

export type ContentStats = {
  total: number;
  imported: number;
  reviewing: number;
  approved: number;
  rejected: number;
}