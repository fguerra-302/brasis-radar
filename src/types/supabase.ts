
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
  type: 'RSS' | 'INSTAGRAM' | 'SPOTIFY' | 'IBGE';
  active: boolean;
  credentials?: {
    access_token?: string;
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
  };
  config?: {
    instagram_user_id?: string;
    spotify_market?: string;
    ibge_service?: string;
  };
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
