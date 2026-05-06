export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      event_functions: {
        Row: {
          created_at: string;
          description: string | null;
          event_id: string;
          id: string;
          location: string | null;
          starts_at: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          event_id: string;
          id?: string;
          location?: string | null;
          starts_at: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          event_id?: string;
          id?: string;
          location?: string | null;
          starts_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_functions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_invitations: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          invited_by: string;
          invited_email: string;
          role: Database["public"]["Enums"]["member_role"];
          token: string;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          invited_by: string;
          invited_email: string;
          role?: Database["public"]["Enums"]["member_role"];
          token?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          invited_by?: string;
          invited_email?: string;
          role?: Database["public"]["Enums"]["member_role"];
          token?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_members: {
        Row: {
          event_id: string;
          id: string;
          joined_at: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Insert: {
          event_id: string;
          id?: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Update: {
          event_id?: string;
          id?: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_photos: {
        Row: {
          caption: string | null;
          created_at: string;
          event_id: string;
          id: string;
          storage_path: string;
          uploader_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          storage_path: string;
          uploader_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          storage_path?: string;
          uploader_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_photos_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"];
          created_at: string;
          description: string | null;
          event_date: string | null;
          host_id: string;
          id: string;
          location: string | null;
          share_code: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["event_category"];
          created_at?: string;
          description?: string | null;
          event_date?: string | null;
          host_id: string;
          id?: string;
          location?: string | null;
          share_code: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["event_category"];
          created_at?: string;
          description?: string | null;
          event_date?: string | null;
          host_id?: string;
          id?: string;
          location?: string | null;
          share_code?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          arrived_at: string | null;
          created_at: string;
          event_id: string;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          rsvp_status: string;
          side: string | null;
        };
        Insert: {
          arrived_at?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          rsvp_status?: string;
          side?: string | null;
        };
        Update: {
          arrived_at?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          rsvp_status?: string;
          side?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          event_id: string | null;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          event_id?: string | null;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          event_id?: string | null;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          business_name: string;
          category: Database["public"]["Enums"]["vendor_category"];
          city: string | null;
          cover_path: string | null;
          created_at: string;
          description: string | null;
          email: string | null;
          id: string;
          is_active: boolean;
          owner_id: string;
          phone: string | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          business_name: string;
          category: Database["public"]["Enums"]["vendor_category"];
          city?: string | null;
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          owner_id: string;
          phone?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          business_name?: string;
          category?: Database["public"]["Enums"]["vendor_category"];
          city?: string | null;
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          owner_id?: string;
          phone?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_member_role: {
        Args: { _event_id: string; _user_id: string };
        Returns: Database["public"]["Enums"]["member_role"];
      };
      is_event_host: {
        Args: { _event_id: string; _user_id: string };
        Returns: boolean;
      };
      is_event_member: {
        Args: { _event_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      event_category: "wedding" | "college_fest" | "private_party" | "corporate";
      member_role: "host" | "family" | "photographer";
      vendor_category:
        | "photography"
        | "catering"
        | "decor"
        | "music"
        | "makeup"
        | "venue"
        | "planner"
        | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      event_category: ["wedding", "college_fest", "private_party", "corporate"],
      member_role: ["host", "family", "photographer"],
      vendor_category: [
        "photography",
        "catering",
        "decor",
        "music",
        "makeup",
        "venue",
        "planner",
        "other",
      ],
    },
  },
} as const;
