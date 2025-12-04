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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          related_voices: string[] | null
          status: string
          title: string
          views: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          related_voices?: string[] | null
          status: string
          title: string
          views?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          related_voices?: string[] | null
          status?: string
          title?: string
          views?: number | null
        }
        Relationships: []
      }
      active_visitors: {
        Row: {
          created_at: string | null
          id: string
          last_seen: string | null
          page: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          page?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          page?: string | null
          session_id?: string
        }
        Relationships: []
      }
      collaboration_areas: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      collaboration_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_profile_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_profile_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          is_core_team_reply: boolean | null
          likes_count: number | null
          parent_comment_id: string | null
          updated_at: string | null
          user_profile_id: string | null
          voice_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_core_team_reply?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_profile_id?: string | null
          voice_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_core_team_reply?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_profile_id?: string | null
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voices"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string | null
          organization: string | null
          phone: string | null
          rating: number | null
          type: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name?: string | null
          organization?: string | null
          phone?: string | null
          rating?: number | null
          type: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string | null
          organization?: string | null
          phone?: string | null
          rating?: number | null
          type?: string
        }
        Relationships: []
      }
      feedback_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          testimonial: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          testimonial?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          testimonial?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pinned_voices: {
        Row: {
          created_at: string | null
          id: string
          pin_location: string | null
          pin_note: string | null
          pinned_by: string
          voice_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pin_location?: string | null
          pin_note?: string | null
          pinned_by: string
          voice_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pin_location?: string | null
          pin_note?: string | null
          pinned_by?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_voices_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_voices_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voices"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string | null
          display_order: number | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string
          profile_image: string | null
          role: string
          whatsapp: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
          profile_image?: string | null
          role: string
          whatsapp: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          profile_image?: string | null
          role?: string
          whatsapp?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string
          user_profile_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          user_profile_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          is_anonymous: boolean | null
          is_blocked: boolean | null
          role: string | null
          session_token: string | null
          unique_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          is_anonymous?: boolean | null
          is_blocked?: boolean | null
          role?: string | null
          session_token?: string | null
          unique_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_anonymous?: boolean | null
          is_blocked?: boolean | null
          role?: string | null
          session_token?: string | null
          unique_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      voice_likes: {
        Row: {
          created_at: string | null
          id: string
          user_profile_id: string
          voice_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_profile_id: string
          voice_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_profile_id?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_likes_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_likes_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voices"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_reshares: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          user_profile_id: string
          voice_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          user_profile_id: string
          voice_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          user_profile_id?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_reshares_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_reshares_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voices"
            referencedColumns: ["id"]
          },
        ]
      }
      voices: {
        Row: {
          age: string | null
          category: string
          comment_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_anonymous: boolean | null
          is_hidden: boolean | null
          likes_count: number | null
          location: string | null
          mood: string
          reshare_count: number | null
          support_count: number | null
          updated_at: string
          user_profile_id: string | null
          username: string | null
        }
        Insert: {
          age?: string | null
          category: string
          comment_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          is_hidden?: boolean | null
          likes_count?: number | null
          location?: string | null
          mood: string
          reshare_count?: number | null
          support_count?: number | null
          updated_at?: string
          user_profile_id?: string | null
          username?: string | null
        }
        Update: {
          age?: string | null
          category?: string
          comment_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          is_hidden?: boolean | null
          likes_count?: number | null
          location?: string | null
          mood?: string
          reshare_count?: number | null
          support_count?: number | null
          updated_at?: string
          user_profile_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voices_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_blogs: {
        Row: {
          author_name: string | null
          content: string
          cover_image_url: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          publish_date: string | null
          summary: string | null
          title: string
          updated_at: string | null
          views_count: number | null
          week_number: number | null
        }
        Insert: {
          author_name?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          publish_date?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          week_number?: number | null
        }
        Update: {
          author_name?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          publish_date?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          week_number?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
