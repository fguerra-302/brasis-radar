
export interface RadarBrasisRow {
  id: string;
  title: string;
  link: string;
  source: string;
  pub_date: string;
  editoria: string;
  tags: string[];
  relevancia: number;
  status: string;
  input_bruto?: string;
  resumo_curado?: string;
  created_at: string;
  updated_at?: string;
}

export interface RadarSourceRow {
  id: string;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RadarKeywordRow {
  id: string;
  category_name: string;
  keywords: string[];
  weight: number;
  created_at: string;
  updated_at?: string;
}
