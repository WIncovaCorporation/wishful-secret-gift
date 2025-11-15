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
      affiliate_clicks: {
        Row: {
          clicked_at: string | null
          commission_earned: number | null
          conversion_date: string | null
          converted: boolean | null
          id: string
          ip_address: unknown
          order_value: number | null
          product_id: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          commission_earned?: number | null
          conversion_date?: string | null
          converted?: boolean | null
          id?: string
          ip_address?: unknown
          order_value?: number | null
          product_id: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          commission_earned?: number | null
          conversion_date?: string | null
          converted?: boolean | null
          id?: string
          ip_address?: unknown
          order_value?: number | null
          product_id?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_products: {
        Row: {
          affiliate_link: string
          affiliate_network: string
          category: string
          commission_rate: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          owner_id: string | null
          price: number | null
          product_url: string | null
          rating: number | null
          reviews_count: number | null
          updated_at: string | null
        }
        Insert: {
          affiliate_link: string
          affiliate_network: string
          category: string
          commission_rate?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          owner_id?: string | null
          price?: number | null
          product_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          updated_at?: string | null
        }
        Update: {
          affiliate_link?: string
          affiliate_network?: string
          category?: string
          commission_rate?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          owner_id?: string | null
          price?: number | null
          product_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_corrections: {
        Row: {
          admin_notes: string | null
          applied_at: string | null
          audit_log_id: string
          code_after: string | null
          code_before: string | null
          created_at: string | null
          file_path: string
          id: string
          issue_description: string
          issue_title: string
          line_number: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          applied_at?: string | null
          audit_log_id: string
          code_after?: string | null
          code_before?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          issue_description: string
          issue_title: string
          line_number?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          applied_at?: string | null
          audit_log_id?: string
          code_after?: string | null
          code_before?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          issue_description?: string
          issue_title?: string
          line_number?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_corrections_audit_log_id_fkey"
            columns: ["audit_log_id"]
            isOneToOne: false
            referencedRelation: "github_audit_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_credentials: {
        Row: {
          access_key: string
          associate_tag: string
          created_at: string
          id: string
          marketplace: string
          secret_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_key: string
          associate_tag: string
          created_at?: string
          id?: string
          marketplace?: string
          secret_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_key?: string
          associate_tag?: string
          created_at?: string
          id?: string
          marketplace?: string
          secret_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      amazon_search_tracking: {
        Row: {
          created_at: string
          id: string
          results_count: number
          search_query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          results_count?: number
          search_query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          results_count?: number
          search_query?: string
          user_id?: string
        }
        Relationships: []
      }
      anonymous_messages: {
        Row: {
          created_at: string
          giver_id: string
          group_id: string
          id: string
          is_read: boolean | null
          message: string
          receiver_id: string
        }
        Insert: {
          created_at?: string
          giver_id: string
          group_id: string
          id?: string
          is_read?: boolean | null
          message: string
          receiver_id: string
        }
        Update: {
          created_at?: string
          giver_id?: string
          group_id?: string
          id?: string
          is_read?: boolean | null
          message?: string
          receiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      gift_card_inventory: {
        Row: {
          code: string
          cost: number
          created_at: string | null
          currency: string | null
          denomination: number
          expires_at: string | null
          id: string
          is_sold: boolean | null
          margin: number | null
          pin: string | null
          retailer: string
          selling_price: number
          sold_at: string | null
          sold_to_user_id: string | null
        }
        Insert: {
          code: string
          cost: number
          created_at?: string | null
          currency?: string | null
          denomination: number
          expires_at?: string | null
          id?: string
          is_sold?: boolean | null
          margin?: number | null
          pin?: string | null
          retailer: string
          selling_price: number
          sold_at?: string | null
          sold_to_user_id?: string | null
        }
        Update: {
          code?: string
          cost?: number
          created_at?: string | null
          currency?: string | null
          denomination?: number
          expires_at?: string | null
          id?: string
          is_sold?: boolean | null
          margin?: number | null
          pin?: string | null
          retailer?: string
          selling_price?: number
          sold_at?: string | null
          sold_to_user_id?: string | null
        }
        Relationships: []
      }
      gift_exchanges: {
        Row: {
          created_at: string
          giver_id: string
          group_id: string
          id: string
          receiver_id: string
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          giver_id: string
          group_id: string
          id?: string
          receiver_id: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          giver_id?: string
          group_id?: string
          id?: string
          receiver_id?: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_exchanges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_items: {
        Row: {
          brand: string | null
          category: string | null
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          is_purchased: boolean | null
          list_id: string
          name: string
          notes: string | null
          priority: string | null
          reference_link: string | null
          size: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_purchased?: boolean | null
          list_id: string
          name: string
          notes?: string | null
          priority?: string | null
          reference_link?: string | null
          size?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_purchased?: boolean | null
          list_id?: string
          name?: string
          notes?: string | null
          priority?: string | null
          reference_link?: string | null
          size?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "gift_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_lists: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_lists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      github_audit_logs: {
        Row: {
          ai_analysis: Json | null
          audit_data: Json
          branch: string | null
          commit_message: string | null
          commit_sha: string | null
          created_at: string
          event_type: string
          findings_summary: Json | null
          id: string
          received_at: string
          repository: string
          status: string
          workflow_name: string
          workflow_run_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          audit_data?: Json
          branch?: string | null
          commit_message?: string | null
          commit_sha?: string | null
          created_at?: string
          event_type: string
          findings_summary?: Json | null
          id?: string
          received_at?: string
          repository: string
          status: string
          workflow_name: string
          workflow_run_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          audit_data?: Json
          branch?: string | null
          commit_message?: string | null
          commit_sha?: string | null
          created_at?: string
          event_type?: string
          findings_summary?: Json | null
          id?: string
          received_at?: string
          repository?: string
          status?: string
          workflow_name?: string
          workflow_run_id?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          list_id: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          list_id?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          list_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "gift_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_id: string | null
          exchange_date: string | null
          id: string
          is_drawn: boolean | null
          max_budget: number | null
          min_budget: number | null
          name: string
          notification_mode: string
          organizer_message: string | null
          share_code: string
          suggested_budget: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_id?: string | null
          exchange_date?: string | null
          id?: string
          is_drawn?: boolean | null
          max_budget?: number | null
          min_budget?: number | null
          name: string
          notification_mode?: string
          organizer_message?: string | null
          share_code: string
          suggested_budget?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_id?: string | null
          exchange_date?: string | null
          id?: string
          is_drawn?: boolean | null
          max_budget?: number | null
          min_budget?: number | null
          name?: string
          notification_mode?: string
          organizer_message?: string | null
          share_code?: string
          suggested_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean | null
          name: string
          price_annual: number
          price_monthly: number
          sort_order: number | null
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean | null
          name: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_suggestions_used: number | null
          created_at: string | null
          groups_count: number | null
          id: string
          last_reset_at: string | null
          participants_total: number | null
          period_end: string | null
          period_start: string | null
          updated_at: string | null
          user_id: string
          wishlists_count: number | null
        }
        Insert: {
          ai_suggestions_used?: number | null
          created_at?: string | null
          groups_count?: number | null
          id?: string
          last_reset_at?: string | null
          participants_total?: number | null
          period_end?: string | null
          period_start?: string | null
          updated_at?: string | null
          user_id: string
          wishlists_count?: number | null
        }
        Update: {
          ai_suggestions_used?: number | null
          created_at?: string | null
          groups_count?: number | null
          id?: string
          last_reset_at?: string | null
          participants_total?: number | null
          period_end?: string | null
          period_start?: string | null
          updated_at?: string | null
          user_id?: string
          wishlists_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_add_participant: { Args: { _group_id: string }; Returns: boolean }
      can_create_group: { Args: { _user_id: string }; Returns: boolean }
      can_use_ai: { Args: { _user_id: string }; Returns: boolean }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      get_products_by_category: {
        Args: { _category?: string; _limit?: number; _offset?: number }
        Returns: {
          affiliate_link: string
          category: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
          rating: number
          reviews_count: number
        }[]
      }
      get_user_features: { Args: { _user_id: string }; Returns: Json }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_creator: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      reset_monthly_usage: { Args: never; Returns: undefined }
      search_affiliate_products: {
        Args: { _limit?: number; _query: string }
        Returns: {
          affiliate_link: string
          category: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
          rating: number
          relevance: number
          reviews_count: number
        }[]
      }
    }
    Enums: {
      app_role: "free_user" | "premium_user" | "corporate_manager" | "admin"
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
      app_role: ["free_user", "premium_user", "corporate_manager", "admin"],
    },
  },
} as const
