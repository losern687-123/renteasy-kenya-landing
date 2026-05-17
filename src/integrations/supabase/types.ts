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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          last_message_at: string | null
          listing_id: string | null
          seeker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          last_message_at?: string | null
          listing_id?: string | null
          seeker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          last_message_at?: string | null
          listing_id?: string | null
          seeker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_applications: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          kra_pin: string
          national_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          kra_pin: string
          national_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          kra_pin?: string
          national_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_landlord_applications_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_cycle: string | null
          created_at: string | null
          end_date: string | null
          id: string
          landlord_id: string
          start_date: string | null
          status: string
          tier_id: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          landlord_id: string
          start_date?: string | null
          status?: string
          tier_id: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          landlord_id?: string
          start_date?: string | null
          status?: string
          tier_id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landlord_subscriptions_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paystack_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_type: string
          paystack_response: Json | null
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_type: string
          paystack_response?: Json | null
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_type?: string
          paystack_response?: Json | null
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_tier: string | null
          email: string
          id: string
          landlord_code: string | null
          landlord_id: string | null
          name: string
          payment_alerts_enabled: boolean | null
          rent_reminders_enabled: boolean | null
          theme_preference: string | null
          updated_at: string
          verification_fee_paid: boolean
        }
        Insert: {
          created_at?: string
          current_tier?: string | null
          email: string
          id: string
          landlord_code?: string | null
          landlord_id?: string | null
          name: string
          payment_alerts_enabled?: boolean | null
          rent_reminders_enabled?: boolean | null
          theme_preference?: string | null
          updated_at?: string
          verification_fee_paid?: boolean
        }
        Update: {
          created_at?: string
          current_tier?: string | null
          email?: string
          id?: string
          landlord_code?: string | null
          landlord_id?: string | null
          name?: string
          payment_alerts_enabled?: boolean | null
          rent_reminders_enabled?: boolean | null
          theme_preference?: string | null
          updated_at?: string
          verification_fee_paid?: boolean
        }
        Relationships: []
      }
      properties: {
        Row: {
          available_for_listing: boolean | null
          created_at: string
          id: string
          landlord_id: string
          location: string
          name: string
          occupancy_status: string | null
          rent_amount: number
          updated_at: string
        }
        Insert: {
          available_for_listing?: boolean | null
          created_at?: string
          id?: string
          landlord_id: string
          location: string
          name: string
          occupancy_status?: string | null
          rent_amount: number
          updated_at?: string
        }
        Update: {
          available_for_listing?: boolean | null
          created_at?: string
          id?: string
          landlord_id?: string
          location?: string
          name?: string
          occupancy_status?: string | null
          rent_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      property_inquiries: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          listing_id: string
          message: string | null
          seeker_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          listing_id: string
          message?: string | null
          seeker_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          listing_id?: string
          message?: string | null
          seeker_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listings: {
        Row: {
          amenities: Json | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          landlord_id: string
          move_in_date: string | null
          property_id: string
          property_type: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          landlord_id: string
          move_in_date?: string | null
          property_id: string
          property_type?: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          landlord_id?: string
          move_in_date?: string | null
          property_id?: string
          property_type?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_listings_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          listing_id: string
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          listing_id: string
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          listing_id?: string
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_records: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          payment_date: string | null
          payment_method: string | null
          property_name: string
          receipt_url: string | null
          status: string
          tenant_id: string
          tenant_name: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          property_name: string
          receipt_url?: string | null
          status: string
          tenant_id: string
          tenant_name?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          property_name?: string
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          tenant_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          seeker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          seeker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          seeker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_properties_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seeker_documents: {
        Row: {
          created_at: string
          document_type: string
          id: string
          seeker_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          seeker_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          seeker_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "seeker_documents_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          landlord_id: string
          metadata: Json | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          landlord_id: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          landlord_id?: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "landlord_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          admin_notes: string | null
          billing_cycle: string | null
          company_name: string | null
          created_at: string | null
          id: string
          landlord_id: string
          phone_number: string
          requested_tier_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          billing_cycle?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          landlord_id: string
          phone_number: string
          requested_tier_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          billing_cycle?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          landlord_id?: string
          phone_number?: string
          requested_tier_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_requests_requested_tier_id_fkey"
            columns: ["requested_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_properties: number | null
          max_tenants: number | null
          name: string
          price_annual: number
          price_monthly: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_properties?: number | null
          max_tenants?: number | null
          name: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_properties?: number | null
          max_tenants?: number | null
          name?: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          email: string
          id: string
          landlord_id: string
          linked_landlord_id: string | null
          name: string
          phone: string
          property_id: string | null
          status: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          landlord_id: string
          linked_landlord_id?: string | null
          name: string
          phone: string
          property_id?: string | null
          status?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          landlord_id?: string
          linked_landlord_id?: string | null
          name?: string
          phone?: string
          property_id?: string | null
          status?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_landlord_code: { Args: never; Returns: string }
      generate_unique_landlord_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_landlord_of_tenant_link: {
        Args: { _landlord_user_id: string; _tenant_name: string }
        Returns: undefined
      }
      validate_landlord_id: {
        Args: { landlord_id_input: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "tenant" | "landlord" | "admin" | "property_seeker"
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
      app_role: ["tenant", "landlord", "admin", "property_seeker"],
    },
  },
} as const
