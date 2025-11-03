// src/types/admission.ts
export interface Faculty {
    id: string;
    name: string;
    code?: string;
    description?: string;
    dean_name?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface AcademicSession {
    id: string;
    session_name: string; // e.g., '2025/2026'
    start_date: string;
    end_date: string;
    is_current: boolean;
    registration_start_date?: string;
    registration_end_date?: string;
    created_at: string;
  }
  
  export interface Course {
    id: string;
    name: string;
    code?: string;
    faculty_id: string;
    degree_type: string;
    duration_years: number;
    description?: string;
    created_at: string;
    updated_at: string;
    faculty?: Faculty; // For joined data
  }
  
  export interface UserProfile { // Basic user info for admission context
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  }
  
  export interface Admission {
    id: string;
    user_id: string;
    course_id: string;
    academic_session_id: string;
    admission_ref: string;
    admission_date: string; // YYYY-MM-DD
    status: 'provisional' | 'confirmed' | 'rejected' | 'expired';
    offer_expires_at: string; // ISO Date string
    acceptance_deadline: string; // ISO Date string
    created_at: string;
    updated_at: string;
    user?: UserProfile;
    course?: Course;
    academic_session?: AcademicSession;
  }
  
  export interface FeeCategory {
    id: string;
    name: string; // 'Compulsory', 'Optional', 'Accommodation'
    display_order: number;
  }
  
  export interface Fee {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    is_active: boolean;
    category_id: string;
    frequency: 'per_semester' | 'once_on_registration' | 'annual';
    fee_code: string;
    is_optional: boolean;
    course_id?: string | null;
    // Joined data
    fee_category?: FeeCategory; // Renamed from 'category' for clarity
    course?: Pick<Course, 'name' | 'code'>; // If fee is course-specific
  }
  
  export interface UniversitySetting {
    id: string;
    setting_key: string;
    setting_value: string;
    description?: string | null;
  }
  
  export interface AdmissionLetterData {
    // University Info
    universityName: string;
    universityMotto?: string;
    registrarOfficeTitle?: string;
    academicDirectorateTitle?: string;
    registrarName?: string;
    contactPhone1?: string;
    contactPhone2?: string;
    universityWebsite?: string;
    bankAccountHolderName?: string;
    bank1Name?: string;
    bank1AccountNumber?: string;
    bank2Name?: string;
    bank2AccountNumber?: string;
  
    // Admission Details
    studentFullName: string;
    admissionRef: string;
    admissionDateFormatted: string; // e.g., "October 26, 2023"
    currentYear: string; // For the letter head like "_____, 2025"
    
    // Course Info
    courseName: string;
    degreeType: string;
    facultyName: string;
    
    // Session Info
    academicSessionName: string;
  
    // Fees
    acceptanceFeeAmountFormatted?: string; // Specifically for the sentence "pay a non-refundable acceptance fee of N..."
    compulsoryPerSemesterFees: Fee[];
    compulsoryOnceOnRegistrationFees: Fee[];
    //optionalAccommodationFees: Fee[];
    optionalFees: Fee[]; // <-- THIS IS THE NEW, CORRECTED PROPERTY
    totalCompulsoryPerSemester: number;
    totalCompulsoryOnceOnRegistration: number;
    
    // Dates
    acceptanceDeadlineFormatted: string; // e.g., "November 9, 2023"
    
    // Add these missing properties:
    logoDataUri?: string; // For university logo
    signatureDataUri?: string; // For registrar signature
  }