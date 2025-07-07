export enum ContentStatus {
  IMPORTED = "A curar",
  REVIEWING = "Em aprovação", 
  APPROVED = "Publicado",
  REJECTED = "Ignorado",
  FOR_NEWSLETTER = "Para Newsletter",
  FOR_SOCIAL = "Para Redes Sociais",
  IN_NEWSLETTER = "Na Newsletter",
  EDITING = "Em edição",
  READY_DISTRIBUTION = "Pronto para distribuição"
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