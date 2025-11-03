// src/types/document.ts

// --- Enums and Labels ---
export enum DocumentType {
  // --- ADD THIS ---
  BIRTH_CERTIFICATE = 'birthcertificate',
  // --- END ADDED ---
  PRIMARY_SCHOOL_CERTIFICATE = 'primaryschoolcertificate',
  SSCE_CERTIFICATE = 'sscecertificate',
  JAMB_RESULT = 'jambresult',
  PASSPORT = 'passport',
  SPONSOR_CONSENT_LETTER = 'sponsorconsentletter',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  // --- ADD THIS ---
  [DocumentType.BIRTH_CERTIFICATE]: 'Birth Certificate',
  // --- END ADDED ---
  [DocumentType.PRIMARY_SCHOOL_CERTIFICATE]: 'Primary School Certificate',
  [DocumentType.SSCE_CERTIFICATE]: 'SSCE Certificate',
  [DocumentType.JAMB_RESULT]: 'JAMB Result',
  [DocumentType.PASSPORT]: 'Passport Photograph',
  [DocumentType.SPONSOR_CONSENT_LETTER]: 'Sponsor Consent Letter',
};

export enum DocumentStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision',
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING_REVIEW]: 'Pending Review',
  [DocumentStatus.APPROVED]: 'Approved',
  [DocumentStatus.REJECTED]: 'Rejected',
  [DocumentStatus.NEEDS_REVISION]: 'Needs Revision',
};


// --- Core Interfaces (No Changes) ---
export interface ApplicationDocument {
  id: string;
  application_id: string;
  user_id: string;
  document_type: DocumentType;
  file_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  status: DocumentStatus;
  admin_comment?: string | null;
  reviewed_by_admin_id?: string | null;
  reviewed_at?: string | null;
}

export interface NewApplicationDocumentFormData {
  document_type: DocumentType | '';
  file: File;
  application_id: string;
}

// --- Admin Specific Types ---
export type ViewCategory = 'status' | 'personal' | 'guardian' | 'education' | 'documents'  | 'course_selection';

export interface DocumentAssociatedUser {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface AdminDocumentView extends ApplicationDocument {
  applicant?: DocumentAssociatedUser;
  reviewed_by_admin?: DocumentAssociatedUser;
}

export interface AdminUpdateDocumentPayload {
  status: DocumentStatus;
  admin_comment?: string;
}

export interface AdminDocumentsFiltersType {
  status: DocumentStatus | '' | string;
  document_type: DocumentType | '';
  applicantSearch: string;
  applicationIdSearch: string;
  dateFrom: string;
  dateTo: string;
  courseSearch: string;
}

export interface AdminApplicantData {
  user_id: string;
  application_id: string;
  applicant_full_name?: string;
  user_email?: string;
  document_review_notes?: string | null;
  application_status?: string;
  application_created_at?: string;

  // Fields for 'personal' view
  surname?: string;
  first_name?: string;
  middle_name?: string | null;
  gender?: string;
  date_of_birth?: string;
  marital_status?: string;

  // Fields for 'guardian' view
  guardian_name?: string;
  guardian_address?: string;
  guardian_occupation?: string;
  guardian_relationship?: string;
  guardian_phone_number?: string;
  
  // Fields for 'education' view
  school_name?: string;
  year_of_entry?: number;
  year_of_graduation?: number;
  qualification_obtained?: string;

  // --- FIELDS FOR 'DOCUMENTS' VIEW (UPDATED) ---
  doc_status?: string;
  doc_admin_comment?: string | null;
  // --- ADD THIS ---
  birthcertificate_uploaded_at?: string | null;
  // --- END ADDED ---
  passport_uploaded_at?: string | null;
  sscecertificate_uploaded_at?: string | null;
  jambresult_uploaded_at?: string | null;
  primaryschoolcertificate_uploaded_at?: string | null;
  sponsorconsentletter_uploaded_at?: string | null;

  first_choice?: string | null;
  second_choice?: string | null;
}

export type SortableAdminApplicantKeys =
  | 'applicant_full_name'
  | 'user_email'
  | 'application_status'
  | 'application_created_at'
  | 'gender'
  | 'date_of_birth'
  | 'marital_status'
  | 'guardian_name'
  | 'guardian_relationship'
  | 'guardian_occupation'
  | 'school_name'
  | 'year_of_entry'
  | 'year_of_graduation'
  | 'qualification_obtained';