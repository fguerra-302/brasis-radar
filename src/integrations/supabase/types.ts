export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      brasis_content: {
        Row: {
          created_at: string | null
          example: string | null
          id: string
          observation: string
          reflection: string | null
          tags: string[] | null
          tip: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          example?: string | null
          id?: string
          observation: string
          reflection?: string | null
          tags?: string[] | null
          tip?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          example?: string | null
          id?: string
          observation?: string
          reflection?: string | null
          tags?: string[] | null
          tip?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      content_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      editorial_weights: {
        Row: {
          created_at: string
          editoria: string
          id: string
          multiplier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          editoria: string
          id?: string
          multiplier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          editoria?: string
          id?: string
          multiplier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          communication_style: string | null
          created_at: string | null
          examples: string | null
          id: string
          key_values: string | null
          name: string
          style: string
          target_audience: string | null
          tone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          communication_style?: string | null
          created_at?: string | null
          examples?: string | null
          id?: string
          key_values?: string | null
          name: string
          style?: string
          target_audience?: string | null
          tone?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          communication_style?: string | null
          created_at?: string | null
          examples?: string | null
          id?: string
          key_values?: string | null
          name?: string
          style?: string
          target_audience?: string | null
          tone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_folders: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_source_links: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          source_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          source_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_source_links_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "project_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_source_links_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "shared_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_brasis: {
        Row: {
          created_at: string | null
          editoria: string
          group_id: string | null
          id: string
          input_bruto: string | null
          link: string
          pub_date: string
          relevancia: number | null
          resumo_curado: string | null
          source: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          editoria?: string
          group_id?: string | null
          id?: string
          input_bruto?: string | null
          link: string
          pub_date: string
          relevancia?: number | null
          resumo_curado?: string | null
          source: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          editoria?: string
          group_id?: string | null
          id?: string
          input_bruto?: string | null
          link?: string
          pub_date?: string
          relevancia?: number | null
          resumo_curado?: string | null
          source?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "radar_brasis_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_keywords: {
        Row: {
          category_name: string
          created_at: string | null
          id: string
          keywords: string[] | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      radar_sources: {
        Row: {
          active: boolean | null
          config: Json | null
          created_at: string | null
          credentials: Json | null
          external_api_config: Json | null
          id: string
          last_sync: string | null
          name: string
          type: string | null
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          external_api_config?: Json | null
          id?: string
          last_sync?: string | null
          name: string
          type?: string | null
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          external_api_config?: Json | null
          id?: string
          last_sync?: string | null
          name?: string
          type?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      radar_tombstones: {
        Row: {
          excluded_at: string | null
          id: string
          link: string
          title: string | null
          user_id: string
        }
        Insert: {
          excluded_at?: string | null
          id?: string
          link: string
          title?: string | null
          user_id: string
        }
        Update: {
          excluded_at?: string | null
          id?: string
          link?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_sources: {
        Row: {
          active: boolean | null
          config: Json | null
          created_at: string | null
          credentials: Json | null
          id: string
          name: string
          type: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          name: string
          type?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          name?: string
          type?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      source_group_assignments: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          source_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          source_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_group_assignments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "radar_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          ai_example_audiences: string[] | null
          ai_newsletter_prompt: string | null
          company_description: string | null
          company_name: string | null
          created_at: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          min_relevance_threshold: number
          newsletter_footer: string | null
          newsletter_signature: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_example_audiences?: string[] | null
          ai_newsletter_prompt?: string | null
          company_description?: string | null
          company_name?: string | null
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          min_relevance_threshold?: number
          newsletter_footer?: string | null
          newsletter_signature?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_example_audiences?: string[] | null
          ai_newsletter_prompt?: string | null
          company_description?: string | null
          company_name?: string | null
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          min_relevance_threshold?: number
          newsletter_footer?: string | null
          newsletter_signature?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      emergency_disable_all_rls: { Args: never; Returns: undefined }
      emergency_disable_rls_brasis: { Args: never; Returns: undefined }
      emergency_disable_rls_keywords: { Args: never; Returns: undefined }
      emergency_disable_rls_sources: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: { details?: Json; event_type: string; user_id?: string }
        Returns: undefined
      }
      source_has_credentials: { Args: { source_id: string }; Returns: boolean }
      update_source_credentials: {
        Args: { new_credentials: Json; source_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
