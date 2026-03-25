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
      bot_reviews: {
        Row: {
          bot_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          bot_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          bot_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_reviews_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bots: {
        Row: {
          avatar_url: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_premium: boolean
          is_public: boolean | null
          messages_count: number | null
          model: string | null
          name: string
          persona: string | null
          premium_free_messages: number
          price: number | null
          status: string | null
          suggested_prompts: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          is_public?: boolean | null
          messages_count?: number | null
          model?: string | null
          name: string
          persona?: string | null
          premium_free_messages?: number
          price?: number | null
          status?: string | null
          suggested_prompts?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          is_public?: boolean | null
          messages_count?: number | null
          model?: string | null
          name?: string
          persona?: string | null
          premium_free_messages?: number
          price?: number | null
          status?: string | null
          suggested_prompts?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_templates: {
        Row: {
          content: Json
          created_at: string
          id: string
          name: string
          platforms: string[]
          prompt: string
          story_profile: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          name?: string
          platforms?: string[]
          prompt?: string
          story_profile?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          name?: string
          platforms?: string[]
          prompt?: string
          story_profile?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      graffiti: {
        Row: {
          created_at: string
          id: string
          image_url: string
          likes_count: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          likes_count?: number
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          likes_count?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      graffiti_likes: {
        Row: {
          created_at: string
          graffiti_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          graffiti_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          graffiti_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graffiti_likes_graffiti_id_fkey"
            columns: ["graffiti_id"]
            isOneToOne: false
            referencedRelation: "graffiti"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          bot_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          bot_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          bot_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          bot_id: string
          created_at: string
          id: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bot_id: string
          created_at?: string
          id?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bot_id?: string
          created_at?: string
          id?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          rewarded: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          rewarded?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          rewarded?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_creations: {
        Row: {
          created_at: string
          file_url: string
          id: string
          metadata: Json | null
          thumbnail_url: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          metadata?: Json | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          bonus_messages: number
          created_at: string
          id: string
          images_used_today: number
          last_reset_date: string
          messages_used_today: number
          user_id: string
        }
        Insert: {
          bonus_messages?: number
          created_at?: string
          id?: string
          images_used_today?: number
          last_reset_date?: string
          messages_used_today?: number
          user_id: string
        }
        Update: {
          bonus_messages?: number
          created_at?: string
          id?: string
          images_used_today?: number
          last_reset_date?: string
          messages_used_today?: number
          user_id?: string
        }
        Relationships: []
      }
      video_style_presets: {
        Row: {
          created_at: string
          id: string
          name: string
          style: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          style: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          style?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_bot_analytics: {
        Args: { owner_id: string }
        Returns: {
          bot_id: string
          last_active: string
          total_messages: number
          unique_users: number
        }[]
      }
      get_or_reset_usage: {
        Args: { p_user_id: string }
        Returns: {
          bonus_messages: number
          created_at: string
          id: string
          images_used_today: number
          last_reset_date: string
          messages_used_today: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_platform_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_bot_messages: {
        Args: { bot_id_input: string }
        Returns: undefined
      }
      increment_usage: {
        Args: { p_type: string; p_user_id: string }
        Returns: {
          bonus_messages: number
          created_at: string
          id: string
          images_used_today: number
          last_reset_date: string
          messages_used_today: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_usage"
          isOneToOne: true
          isSetofReturn: false
        }
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
