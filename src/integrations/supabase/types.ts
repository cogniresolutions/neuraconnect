export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          ip_whitelist: string[] | null
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string | null
          persona_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name?: string | null
          persona_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string | null
          persona_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_monitoring: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          response_time: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_monitoring_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_analysis: {
        Row: {
          analysis_timestamp: string | null
          background_objects: Json | null
          created_at: string
          emotion_data: Json | null
          environment_context: Json | null
          environment_data: Json | null
          id: string
          persona_id: string | null
          scene_description: string | null
          user_id: string | null
        }
        Insert: {
          analysis_timestamp?: string | null
          background_objects?: Json | null
          created_at?: string
          emotion_data?: Json | null
          environment_context?: Json | null
          environment_data?: Json | null
          id?: string
          persona_id?: string | null
          scene_description?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_timestamp?: string | null
          background_objects?: Json | null
          created_at?: string
          emotion_data?: Json | null
          environment_context?: Json | null
          environment_data?: Json | null
          id?: string
          persona_id?: string | null
          scene_description?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_analysis_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotion_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_aggregations: {
        Row: {
          average_mood: number | null
          created_at: string
          dominant_mood: string | null
          id: string
          location_name: string
          location_type: string
          total_entries: number | null
          updated_at: string
        }
        Insert: {
          average_mood?: number | null
          created_at?: string
          dominant_mood?: string | null
          id?: string
          location_name: string
          location_type: string
          total_entries?: number | null
          updated_at?: string
        }
        Update: {
          average_mood?: number | null
          created_at?: string
          dominant_mood?: string | null
          id?: string
          location_name?: string
          location_type?: string
          total_entries?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      mood_challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          location_name: string | null
          location_type: string | null
          participants_count: number | null
          start_date: string
          target_mood: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          location_name?: string | null
          location_type?: string | null
          participants_count?: number | null
          start_date: string
          target_mood: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          location_name?: string | null
          location_type?: string | null
          participants_count?: number | null
          start_date?: string
          target_mood?: string
          title?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          confidence: number
          created_at: string
          id: string
          mood: string
          notes: string | null
          source: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          mood: string
          notes?: string | null
          source: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          mood?: string
          notes?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_locations: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location_grid_id: string | null
          longitude: number | null
          mood_entry_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_grid_id?: string | null
          longitude?: number | null
          mood_entry_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_grid_id?: string | null
          longitude?: number | null
          mood_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_locations_mood_entry_id_fkey"
            columns: ["mood_entry_id"]
            isOneToOne: false
            referencedRelation: "mood_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_recommendations: {
        Row: {
          created_at: string
          id: string
          mood_pattern: string
          recommendation: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood_pattern: string
          recommendation: string
        }
        Update: {
          created_at?: string
          id?: string
          mood_pattern?: string
          recommendation?: string
        }
        Relationships: []
      }
      music_sources: {
        Row: {
          age_range: unknown | null
          artist: string | null
          created_at: string
          description: string | null
          id: string
          language: string
          mood_tags: string[]
          platform: string
          title: string
          url: string
        }
        Insert: {
          age_range?: unknown | null
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language: string
          mood_tags: string[]
          platform: string
          title: string
          url: string
        }
        Update: {
          age_range?: unknown | null
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[]
          platform?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      persona_training_materials: {
        Row: {
          analysis_results: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          persona_id: string | null
          status: string | null
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          analysis_results?: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          persona_id?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_results?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          persona_id?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_training_materials_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_training_materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          avatar_model_url: string | null
          avatar_url: string | null
          created_at: string
          description: string | null
          emotion_settings: Json | null
          environment_analysis: boolean | null
          facial_expressions: Json | null
          id: string
          last_analyzed_at: string | null
          model_config: Json | null
          name: string
          personality: string | null
          profile_picture_url: string | null
          requires_training_video: boolean | null
          skills: Json | null
          status: string | null
          topics: string[] | null
          training_materials: Json | null
          updated_at: string
          user_id: string | null
          voice_style: string | null
        }
        Insert: {
          avatar_model_url?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          emotion_settings?: Json | null
          environment_analysis?: boolean | null
          facial_expressions?: Json | null
          id?: string
          last_analyzed_at?: string | null
          model_config?: Json | null
          name: string
          personality?: string | null
          profile_picture_url?: string | null
          requires_training_video?: boolean | null
          skills?: Json | null
          status?: string | null
          topics?: string[] | null
          training_materials?: Json | null
          updated_at?: string
          user_id?: string | null
          voice_style?: string | null
        }
        Update: {
          avatar_model_url?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          emotion_settings?: Json | null
          environment_analysis?: boolean | null
          facial_expressions?: Json | null
          id?: string
          last_analyzed_at?: string | null
          model_config?: Json | null
          name?: string
          personality?: string | null
          profile_picture_url?: string | null
          requires_training_video?: boolean | null
          skills?: Json | null
          status?: string | null
          topics?: string[] | null
          training_materials?: Json | null
          updated_at?: string
          user_id?: string | null
          voice_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          id: string
          music_preferences: Json | null
          preferred_language: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id: string
          music_preferences?: Json | null
          preferred_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          music_preferences?: Json | null
          preferred_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          age_range: unknown | null
          created_at: string
          description: string | null
          id: string
          language: string
          mood_tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          age_range?: unknown | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          age_range?: unknown | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      tavus_sessions: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_active: boolean | null
          last_checked_at: string
          participants: Json | null
          session_type: string | null
          status: string
          updated_at: string
          user_id: string | null
          video_call_id: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string
          participants?: Json | null
          session_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          video_call_id?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string
          participants?: Json | null
          session_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          video_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tavus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          consent_url: string
          created_at: string
          expression_segments: Json | null
          id: string
          persona_id: string | null
          processing_status: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          video_url: string
        }
        Insert: {
          consent_url: string
          created_at?: string
          expression_segments?: Json | null
          id?: string
          persona_id?: string | null
          processing_status?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          video_url: string
        }
        Update: {
          consent_url?: string
          created_at?: string
          expression_segments?: Json | null
          id?: string
          persona_id?: string | null
          processing_status?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_name: string
          achievement_type: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_name: string
          achievement_type: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_name?: string
          achievement_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_location_grid_id: {
        Args: {
          lat: number
          lon: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
