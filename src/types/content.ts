export enum ContentStatus {
  COLLECTED = "Coletado",
  REVIEWING = "Em aprovação",
  FOR_NEWSLETTER = "Para Newsletter",
  IN_EDITING = "Em edição",
  REJECTED = "Ignorado",
  PUBLISHED = "Publicado"
}

export type ContentGroup = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export type SourceGroupAssignment = {
  id: string;
  user_id: string;
  source_id: string;
  group_id: string;
  created_at: string;
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
  group_id?: string;
}

export type ContentFilters = {
  status?: ContentStatus;
  editoria?: string;
  tags?: string[];
  searchTerm?: string;
  group_id?: string;
}

export type ContentStats = {
  total: number;
  imported: number;
  reviewing: number;
  approved: number;
  rejected: number;
}
