export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          id: string
          session_name: string
          start_date: string
          end_date: string
          is_current: boolean | null
          registration_start_date: string | null
          registration_end_date: string | null
          created_at: string | null
        }
        Insert: {}
        Update: {}
      },
      admission_letter_templates: {
        Row: {
          id: string
          template_name: string
          template_content: string
          is_default: boolean | null
          created_at: string | null
        }
        Insert: {}
        Update: {}
      },
      admissions: {
        Row: {
          id: string
          user_id: string
          course_id: string
          academic_session_id: string
          admission_ref: string | null
          admission_date: string | null
          status: string | null
          offer_expires_at: string | null
          acceptance_deadline: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {}
        Update: {}
      },
      applicant_docs_verification_view: {
        Row: {
          user_id: string | null
          user_first_name: string | null
          user_last_name: string | null
          user_email: string | null
          application_id: string | null
          application_status: "DRAFT" | "PENDING_DOCUMENTS" | "SUBMITTED" | "DOCUMENTS_PENDING_REVIEW" | "DOCUMENTS_VERIFIED" | "DOCUMENT_ISSUES" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "AWAITING_PAYMENT" | "DOCUMENT_UPLOAD_FAILED" | "DB_DOCUMENT_ERROR" | null
          document_review_notes: string | null
          application_first_name: string | null
          application_surname: string | null
          applicant_full_name: string | null
          application_created_at: string | null
          application_updated_at: string | null
        }
        Insert: {}
        Update: {}
      },
      application_documents: {
        Row: {
          id: string
          user_id: string
          passport_file_path: string | null
          passport_original_filename: string | null
          passport_file_size: number | null
          passport_uploaded_at: string | null
          sponsorconsentletter_file_path: string | null
          sponsorconsentletter_original_filename: string | null
          sponsorconsentletter_file_size: number | null
          sponsorconsentletter_uploaded_at: string | null
          primaryschoolcertificate_file_path: string | null
          primaryschoolcertificate_original_filename: string | null
          primaryschoolcertificate_file_size: number | null
          primaryschoolcertificate_uploaded_at: string | null
          sscecertificate_file_path: string | null
          sscecertificate_original_filename: string | null
          sscecertificate_file_size: number | null
          sscecertificate_uploaded_at: string | null
          jambresult_file_path: string | null
          jambresult_original_filename: string | null
          jambresult_file_size: number | null
          jambresult_uploaded_at: string | null
          created_at: string
          updated_at: string
          status: string
          admin_comment: string | null
          reviewed_by_admin_id: string | null
          reviewed_at: string | null
        }
        Insert: {}
        Update: {}
      },
      applications: {
        Row: {
          id: string
          user_id: string | null
          surname: string
          first_name: string
          middle_name: string | null
          gender: string
          date_of_birth: string
          marital_status: string
          state_of_origin: string
          lga: string
          religion: string
          address: string
          phone_number: string
          disability: string | null
          health_challenge: string | null
          guardian_name: string | null
          guardian_address: string | null
          guardian_occupation: string | null
          guardian_relationship: string | null
          guardian_phone_number: string | null
          school_name: string | null
          year_of_entry: number | null
          year_of_graduation: number | null
          qualification_obtained: string | null
          first_choice: string | null
          second_choice: string | null
          jamb_registration_number: string | null
          application_date: string
          status: "DRAFT" | "PENDING_DOCUMENTS" | "SUBMITTED" | "DOCUMENTS_PENDING_REVIEW" | "DOCUMENTS_VERIFIED" | "DOCUMENT_ISSUES" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "AWAITING_PAYMENT" | "DOCUMENT_UPLOAD_FAILED" | "DB_DOCUMENT_ERROR"
          document_review_notes: string | null
          documents_reviewed_by: string | null
          documents_reviewed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {}
        Update: {}
      },
      courses: {
        Row: {
          id: string
          name: string
          code: string | null
          faculty_id: string
          degree_type: string | null
          duration_years: number | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {}
        Update: {}
      },
      faculties: {
        Row: {
          id: string
          name: string
          code: string | null
          description: string | null
          dean_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {}
        Update: {}
      },
      fee_categories: {
        Row: {
          id: string
          name: string
          display_order: number | null
          created_at: string | null
        }
        Insert: {}
        Update: {}
      },
      fees: {
        Row: {
          id: string
          name: string
          description: string | null
          amount: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
          category_id: string | null
          frequency: string | null
          fee_code: string | null
          is_optional: boolean | null
          course_id: string | null
        }
        Insert: {}
        Update: {}
      },
      payments: {
        Row: {
          id: string
          user_id: string
          application_id: string | null
          amount: number
          payment_date: string
          status: "pending" | "confirmed" | "failed"
          receipt_url: string | null
          receipt_filename: string | null
          transaction_reference: string | null
          created_at: string
          updated_at: string
          admin_comment: string | null
          processed_by_admin_id: string | null
          processed_at: string | null
          fee_id: string | null
        }
        Insert: {}
        Update: {}
      },
      profiles: {
        Row: {
          id: string
          tenant_id: string | null
          first_name: string | null
          last_name: string | null
          class: string | null
          role: string | null
          status: "Incomplete" | "Pending" | "Approved" | "Revoked"
          created_at: string
          updated_at: string
        }
        Insert: {}
        Update: {}
      },
      school: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          school_name: string
          school_address: string
          created_at: string
          updated_at: string
        }
        Insert: {}
        Update: {}
      },
      tenants: {
        Row: {
          id: string
          name: string
          email: string
          address: string | null
          created_at: string
          updated_at: string
          contact: string | null
          telephone: string | null
          state: string | null
          city: string | null
          subscription_start: string | null
          subscription_end: string | null
          paid: boolean
        }
        Insert: {}
        Update: {}
      },
      university_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          description: string | null
          updated_at: string | null
        }
        Insert: {}
        Update: {}
      },
      users: {
        Row: {
          id: string
          tenant_id: string | null
          first_name: string | null
          last_name: string | null
          class: "JS1" | "JS2" | "JS3" | "SS1" | "SS2" | "SS3" | "None" | null
          status: "approved" | "pending" | "terminated"
          email: string
          created_at: string
          updated_at: string
          approved_by: string | null
          approved_at: string | null
          role: "admin" | "teacher" | "student" | "applicant" | null
          admin_comment_docs_biodata: string | null
        }
        Insert: {}
        Update: {}
      },
    }
    Views: {}
    Functions: {}
  }
}