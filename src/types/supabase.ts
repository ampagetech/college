export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          registration_end_date: string | null
          registration_start_date: string | null
          session_name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          registration_end_date?: string | null
          registration_start_date?: string | null
          session_name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          registration_end_date?: string | null
          registration_start_date?: string | null
          session_name?: string
          start_date?: string
        }
        Relationships: []
      }
      admission_letter_templates: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          template_content: string
          template_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          template_content: string
          template_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          template_content?: string
          template_name?: string
        }
        Relationships: []
      }
      admissions: {
        Row: {
          academic_session_id: string
          acceptance_deadline: string | null
          admission_date: string | null
          admission_ref: string | null
          course_id: string
          created_at: string | null
          id: string
          offer_expires_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academic_session_id: string
          acceptance_deadline?: string | null
          admission_date?: string | null
          admission_ref?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          offer_expires_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academic_session_id?: string
          acceptance_deadline?: string | null
          admission_date?: string | null
          admission_ref?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          offer_expires_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "applicant_docs_verification_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          admin_comment: string | null
          application_id: string
          content_type: string
          created_at: string
          document_type: Database["public"]["Enums"]["document_type_enum_lowercase"]
          file_path: string
          file_size: number
          id: string
          original_filename: string
          reviewed_at: string | null
          reviewed_by_admin_id: string | null
          status: Database["public"]["Enums"]["document_status_enum_lowercase"]
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          admin_comment?: string | null
          application_id: string
          content_type: string
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type_enum_lowercase"]
          file_path: string
          file_size: number
          id?: string
          original_filename: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["document_status_enum_lowercase"]
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          admin_comment?: string | null
          application_id?: string
          content_type?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type_enum_lowercase"]
          file_path?: string
          file_size?: number
          id?: string
          original_filename?: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["document_status_enum_lowercase"]
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applicant_docs_verification_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviewed_by_admin"
            columns: ["reviewed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "applicant_docs_verification_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_reviewed_by_admin"
            columns: ["reviewed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      

      applications: {
        Row: {
          address: string
          application_date: string
          created_at: string | null
          date_of_birth: string
          disability: string | null
          document_review_notes: string | null
          documents_reviewed_at: string | null
          documents_reviewed_by: string | null
          // first_choice: was removed
          first_choice_course_id: string | null // <-- ADDED
          first_name: string
          gender: string
          guardian_address: string | null
          guardian_name: string | null
          guardian_occupation: string | null
          guardian_phone_number: string | null
          guardian_relationship: string | null
          health_challenge: string | null
          id: string
          jamb_registration_number: string | null
          lga: string
          marital_status: string
          middle_name: string | null
          phone_number: string
          qualification_obtained: string | null
          qualification_obtained_2: string | null // <-- ADDED
          qualification_obtained_3: string | null // <-- ADDED
          religion: string
          school_name: string | null
          school_name_2: string | null // <-- ADDED
          school_name_3: string | null // <-- ADDED
          // second_choice: was removed
          second_choice_course_id: string | null // <-- ADDED
          state_of_origin: string
          status: Database["public"]["Enums"]["application_status"]
          surname: string
          updated_at: string | null
          user_id: string | null
          year_of_entry: number | null
          year_of_entry_2: number | null // <-- ADDED
          year_of_entry_3: number | null // <-- ADDED
          year_of_graduation: number | null
          year_of_graduation_2: number | null // <-- ADDED
          year_of_graduation_3: number | null // <-- ADDED
        }
        Insert: {
          address: string
          application_date?: string
          created_at?: string | null
          date_of_birth: string
          disability?: string | null
          document_review_notes?: string | null
          documents_reviewed_at?: string | null
          documents_reviewed_by?: string | null
          // first_choice: was removed
          first_choice_course_id?: string | null // <-- ADDED
          first_name: string
          gender: string
          guardian_address?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone_number?: string | null
          guardian_relationship?: string | null
          health_challenge?: string | null
          id?: string
          jamb_registration_number?: string | null
          lga: string
          marital_status: string
          middle_name?: string | null
          phone_number: string
          qualification_obtained?: string | null
          qualification_obtained_2?: string | null // <-- ADDED
          qualification_obtained_3?: string | null // <-- ADDED
          religion: string
          school_name?: string | null
          school_name_2?: string | null // <-- ADDED
          school_name_3?: string | null // <-- ADDED
          // second_choice: was removed
          second_choice_course_id?: string | null // <-- ADDED
          state_of_origin: string
          status?: Database["public"]["Enums"]["application_status"]
          surname: string
          updated_at?: string | null
          user_id?: string | null
          year_of_entry?: number | null
          year_of_entry_2?: number | null // <-- ADDED
          year_of_entry_3?: number | null // <-- ADDED
          year_of_graduation?: number | null
          year_of_graduation_2?: number | null // <-- ADDED
          year_of_graduation_3?: number | null // <-- ADDED
        }
        Update: {
          address?: string
          application_date?: string
          created_at?: string | null
          date_of_birth?: string
          disability?: string | null
          document_review_notes?: string | null
          documents_reviewed_at?: string | null
          documents_reviewed_by?: string | null
          // first_choice: was removed
          first_choice_course_id?: string | null // <-- ADDED
          first_name?: string
          gender?: string
          guardian_address?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone_number?: string | null
          guardian_relationship?: string | null
          health_challenge?: string | null
          id?: string
          jamb_registration_number?: string | null
          lga?: string
          marital_status?: string
          middle_name?: string | null
          phone_number?: string
          qualification_obtained?: string | null
          qualification_obtained_2?: string | null // <-- ADDED
          qualification_obtained_3?: string | null // <-- ADDED
          religion?: string
          school_name?: string | null
          school_name_2?: string | null // <-- ADDED
          school_name_3?: string | null // <-- ADDED
          // second_choice: was removed
          second_choice_course_id?: string | null // <-- ADDED
          state_of_origin?: string
          status?: Database["public"]["Enums"]["application_status"]
          surname?: string
          updated_at?: string | null
          user_id?: string | null
          year_of_entry?: number | null
          year_of_entry_2?: number | null // <-- ADDED
          year_of_entry_3?: number | null // <-- ADDED
          year_of_graduation?: number | null
          year_of_graduation_2?: number | null // <-- ADDED
          year_of_graduation_3?: number | null // <-- ADDED
        }
        Relationships: [
          {
            foreignKeyName: "applications_documents_reviewed_by_fkey"
            columns: ["documents_reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_first_choice_course_fkey"
            columns: ["first_choice_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_second_choice_course_fkey"
            columns: ["second_choice_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }







      courses: {
        Row: {
          code: string | null
          created_at: string | null
          degree_type: string | null
          description: string | null
          duration_years: number | null
          faculty_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          duration_years?: number | null
          faculty_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          duration_years?: number | null
          faculty_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          code: string | null
          created_at: string | null
          dean_name: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          dean_name?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          dean_name?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fee_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount: number
          category_id: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          fee_code: string | null
          frequency: string | null
          id: string
          is_active: boolean
          is_optional: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          fee_code?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          is_optional?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          fee_code?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          is_optional?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_comment: string | null
          amount: number
          application_id: string | null
          created_at: string
          fee_id: string | null
          id: string
          payment_date: string
          processed_at: string | null
          processed_by_admin_id: string | null
          receipt_filename: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status_enum"]
          transaction_reference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_comment?: string | null
          amount: number
          application_id?: string | null
          created_at?: string
          fee_id?: string | null
          id?: string
          payment_date?: string
          processed_at?: string | null
          processed_by_admin_id?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status_enum"]
          transaction_reference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_comment?: string | null
          amount?: number
          application_id?: string | null
          created_at?: string
          fee_id?: string | null
          id?: string
          payment_date?: string
          processed_at?: string | null
          processed_by_admin_id?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status_enum"]
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applicant_docs_verification_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "applicant_docs_verification_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          class: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          status: Database["public"]["Enums"]["profile_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          class?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          class?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      school: {
        Row: {
          created_at: string
          id: string
          school_address: string
          school_name: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          school_address: string
          school_name: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          school_address?: string
          school_name?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          city: string | null
          contact: string | null
          created_at: string
          email: string
          id: string
          name: string
          paid: boolean
          state: string | null
          subscription_end: string | null
          subscription_start: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          paid?: boolean
          state?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          paid?: boolean
          state?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      university_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          admin_comment_docs_biodata: string | null
          approved_at: string | null
          approved_by: string | null
          class: Database["public"]["Enums"]["class_level"] | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status_lowercase"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          admin_comment_docs_biodata?: string | null
          approved_at?: string | null
          approved_by?: string | null
          class?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status_lowercase"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_comment_docs_biodata?: string | null
          approved_at?: string | null
          approved_by?: string | null
          class?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status_lowercase"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "applicant_docs_verification_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      applicant_docs_verification_view: {
        Row: {
          applicant_full_name: string | null
          application_created_at: string | null
          application_first_name: string | null
          application_id: string | null
          application_status:
            | Database["public"]["Enums"]["application_status"]
            | null
          application_surname: string | null
          application_updated_at: string | null
          document_review_notes: string | null
          user_email: string | null
          user_first_name: string | null
          user_id: string | null
          user_last_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      extract_app_id_from_path: {
        Args: { file_path: string }
        Returns: string
      }
    }
    Enums: {
      application_status:
        | "DRAFT"
        | "PENDING_DOCUMENTS"
        | "SUBMITTED"
        | "DOCUMENTS_PENDING_REVIEW"
        | "DOCUMENTS_VERIFIED"
        | "DOCUMENT_ISSUES"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "AWAITING_PAYMENT"
        | "DOCUMENT_UPLOAD_FAILED"
        | "DB_DOCUMENT_ERROR"
      class_level: "JS1" | "JS2" | "JS3" | "SS1" | "SS2" | "SS3" | "None"
      document_status_enum_lowercase:
        | "pending_review"
        | "approved"
        | "rejected"
        | "needs_revision"
      document_type_enum_lowercase:
        | "primaryschoolcertificate"
        | "sscecertificate"
        | "jambresult"
        | "passport"
        | "sponsorconsentletter"
      payment_category_enum:
        | "acceptance_fee"
        | "registration_fee"
        | "tuition_fee"
        | "other"
      payment_status_enum: "pending" | "confirmed" | "failed"
      profile_status: "Incomplete" | "Pending" | "Approved" | "Revoked"
      user_role: "admin" | "teacher" | "student" | "applicant"
      user_status_lowercase: "approved" | "pending" | "terminated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: [
        "DRAFT",
        "PENDING_DOCUMENTS",
        "SUBMITTED",
        "DOCUMENTS_PENDING_REVIEW",
        "DOCUMENTS_VERIFIED",
        "DOCUMENT_ISSUES",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "AWAITING_PAYMENT",
        "DOCUMENT_UPLOAD_FAILED",
        "DB_DOCUMENT_ERROR",
      ],
      class_level: ["JS1", "JS2", "JS3", "SS1", "SS2", "SS3", "None"],
      document_status_enum_lowercase: [
        "pending_review",
        "approved",
        "rejected",
        "needs_revision",
      ],
      document_type_enum_lowercase: [
        "primaryschoolcertificate",
        "sscecertificate",
        "jambresult",
        "passport",
        "sponsorconsentletter",
      ],
      payment_category_enum: [
        "acceptance_fee",
        "registration_fee",
        "tuition_fee",
        "other",
      ],
      payment_status_enum: ["pending", "confirmed", "failed"],
      profile_status: ["Incomplete", "Pending", "Approved", "Revoked"],
      user_role: ["admin", "teacher", "student", "applicant"],
      user_status_lowercase: ["approved", "pending", "terminated"],
    },
  },
} as const
