// C:\DevWeb\college-saas\src\lib\constants.ts

/**
 * User role definitions
 */
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  APPLICANT: 'applicant',
  PUBLIC: 'public',
} as const;

/**
 * Application path definitions
 */
export const PATHS = {
  HOME: '/',
  SIGNIN: '/signin',
  REGISTER: '/register',
  AUTH_ERROR: '/error',
  UNAUTHORIZED: '/unauthorized',
  MANAGE_TENANTS: '/tenants89asdf11',
  BIO_DATA: '/applications/bio-data',
  BIO_DATA_OVERVIEW: '/applications/bio-data',
  BIO_DATA_PERSONAL: '/applications/bio-data/personal',
  BIO_DATA_GUARDIAN: '/applications/bio-data/guardian',
  BIO_DATA_EDUCATION: '/applications/bio-data/education',
  DOCUMENTS: '/documents',
  PAYMENTS: '/payments',
  APPLICANT_ADMISSION_LETTER: '/my-admission-letter',
  VIEW_ADMISSION_LETTER: '/letter',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_EDIT_JEWEL: '/profile/jewel',
  ADMIN_USERS: '/admin/users',
  ADMIN_MANAGE_PAYMENTS: '/admin/payments',
  ADMIN_MANAGE_DOCUMENTS: '/admin/documents',
  ADMIN_MANAGE_FEES: '/admin/fees',
  ADMIN_ADMISSIONS: '/admin/admissions',
  ADMIN_ADMISSIONS_CREATE: '/admin/admissions/create',
  ADMIN_FACULTIES: '/admin/faculties',
  ADMIN_COURSES: '/admin/courses',
  STUDENT_ADMISSIONS: '/admissions',
  STUDENT_ADMISSION_LETTER: '/admissions/[admissionId]/letter',
  ASSISTANT: '/assistant',
  QUIZ: '/quiz',
  QUIZ_PERFORMANCE: '/quiz-performance-timeline',
  QUIZ_RESULTS: '/quiz-results-table',
  SCHEME: '/scheme-table',
  SCHEME_WORDCLOUD: '/scheme-wordcloud',
  ISSUES: '/issues',
  NATURAL_LANG_TO_SQL: '/natural-lang-to-sql',
  // Add the new path here
  QURAN: '/quran',

} as const;

/**
 * Paths accessible to unauthenticated users
 */
export const PUBLIC_PATHS = [
  PATHS.HOME,
  PATHS.SIGNIN,
  PATHS.REGISTER,
  PATHS.AUTH_ERROR,
  PATHS.MANAGE_TENANTS,
] as const;

/**
 * Common paths accessible to all authenticated users
 */
export const COMMON_AUTH_PATHS = [
  PATHS.PROFILE_EDIT,
  PATHS.PROFILE_EDIT_JEWEL,
  PATHS.PAYMENTS,
  PATHS.STUDENT_ADMISSIONS,
  PATHS.STUDENT_ADMISSION_LETTER,
  PATHS.ASSISTANT,
] as const;

export const FEE_CATEGORY_NAMES = {
  COMPULSORY: 'Compulsory',
  OPTIONAL: 'Optional',
  ACCOMMODATION: 'Accommodation',
} as const;

export const ADMISSION_STATUSES = {
  PROVISIONAL: 'provisional',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type AdmissionStatusType = typeof ADMISSION_STATUSES[keyof typeof ADMISSION_STATUSES];

export const FEE_FREQUENCIES = {
  PER_SEMESTER: 'per_semester',
  ONCE_ON_REGISTRATION: 'once_on_registration',
  ANNUAL: 'annual',
} as const;

export type FeeFrequencyType = typeof FEE_FREQUENCIES[keyof typeof FEE_FREQUENCIES];

export const DEGREE_TYPES_NIGERIA = {
  BSC: 'B.Sc.',
  BA: 'B.A.',
  BENG: 'B.Eng.',
  MSC: 'M.Sc.',
  MA: 'M.A.',
  MBA: 'MBA',
  PHD: 'PhD',
  HND: 'HND',
  ND: 'ND',
} as const;

export const ADMISSION_API_ROUTES = {
  GET_STUDENT_ADMISSIONS: '/api/admissions',
  GET_STUDENT_ADMISSION_DETAIL: '/api/admissions/[admissionId]',
  GET_STUDENT_ADMISSION_LETTER_DATA: '/api/admissions/[admissionId]/letter',
  DOWNLOAD_STUDENT_ADMISSION_LETTER_PDF: '/api/admissions/[admissionId]/letter/pdf',
  ADMIN_CREATE_ADMISSION: '/api/admin/admissions',
  ADMIN_UPDATE_ADMISSION: '/api/admin/admissions/[admissionId]',
  ADMIN_DELETE_ADMISSION: '/api/admin/admissions/[admissionId]',
} as const;

export const ACCEPTANCE_FEE_CODE = 'ACPT_FEE';
export const OFFER_EXPIRY_DAYS = 30;
export const ACCEPTANCE_DEADLINE_DAYS = 14;

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DRAFT = 'DRAFT',
}

export const applicationStatusLabels: Record<ApplicationStatus | string, string> = {
  [ApplicationStatus.SUBMITTED]: 'Submitted',
  [ApplicationStatus.PENDING]: 'Pending Review',
  [ApplicationStatus.APPROVED]: 'Approved',
  [ApplicationStatus.REJECTED]: 'Rejected',
  [ApplicationStatus.DRAFT]: 'Draft',
};

export const filterableApplicationStatusOptions = {
  '': 'All Statuses',
  ...applicationStatusLabels,
};