// src/lib/config/documentFields.ts

import { DocumentType, documentTypeLabels } from '@/types/document';

export interface DocumentField {
  id: DocumentType;
  label: string;
  description: string;
  required: boolean;
  maxSizeInMb: number;
  allowedFileTypes: {
    [key: string]: string[];
  };
  expectedServerContentTypes?: string[];
}

// This array now includes the new Birth Certificate field at the top.
export const documentFields: DocumentField[] = [
  // --- ADD THIS NEW OBJECT AT THE TOP ---
  {
    id: DocumentType.BIRTH_CERTIFICATE,
    label: documentTypeLabels[DocumentType.BIRTH_CERTIFICATE],
    description: 'Official birth certificate issued by a government authority.',
    required: true,
    maxSizeInMb: 5,
    allowedFileTypes: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    expectedServerContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  // --- END OF ADDED OBJECT ---

  // The rest of the fields are unchanged and correctly pushed down.
  {
    id: DocumentType.PASSPORT,
    label: documentTypeLabels[DocumentType.PASSPORT],
    description: 'A recent, clear, color photograph (2x2 inches).',
    required: true,
    maxSizeInMb: 2,
    allowedFileTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    expectedServerContentTypes: ['image/jpeg', 'image/png'],
  },
  {
    id: DocumentType.JAMB_RESULT,
    label: documentTypeLabels[DocumentType.JAMB_RESULT],
    description: 'Your official JAMB result slip.',
    required: true,
    maxSizeInMb: 5,
    allowedFileTypes: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    expectedServerContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    id: DocumentType.PRIMARY_SCHOOL_CERTIFICATE,
    label: documentTypeLabels[DocumentType.PRIMARY_SCHOOL_CERTIFICATE],
    description: 'First School Leaving Certificate (FSLC).',
    required: true,
    maxSizeInMb: 5,
    allowedFileTypes: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    expectedServerContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    id: DocumentType.SSCE_CERTIFICATE,
    label: documentTypeLabels[DocumentType.SSCE_CERTIFICATE],
    description: 'WAEC, NECO, or NABTEB certificate. Combine multiple sittings into one file if necessary.',
    required: true,
    maxSizeInMb: 5,
    allowedFileTypes: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    expectedServerContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    id: DocumentType.SPONSOR_CONSENT_LETTER,
    label: documentTypeLabels[DocumentType.SPONSOR_CONSENT_LETTER],
    description: 'A signed letter from your sponsor/guardian (Optional).',
    required: false,
    maxSizeInMb: 5,
    allowedFileTypes: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    expectedServerContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
];