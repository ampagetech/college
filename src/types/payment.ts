// src/types/payment.ts

// Removed PaymentCategory enum
// Removed paymentCategoryLabels are now corrected below based on DB enum

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed', // << CHANGED from APPROVED to CONFIRMED, value 'confirmed'
  FAILED = 'failed',     // << CHANGED from REJECTED to FAILED, value 'failed'
  // If you have other statuses like 'rejected' distinct from 'failed' in your DB enum, add them here.
  // For example, if your DB enum was 'pending', 'confirmed', 'failed', 'rejected':
  // REJECTED = 'rejected', 
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.CONFIRMED]: 'Confirmed', // << Label updated for CONFIRMED
  [PaymentStatus.FAILED]: 'Failed',       // << Label updated for FAILED
  // If you added REJECTED above:
  // [PaymentStatus.REJECTED]: 'Rejected',
};

export interface Fee {
  id: string; // UUID
  name: string; 
  description?: string | null;
  amount: number;
  is_active: boolean;
  created_at?: string; 
  updated_at?: string; 
}

export interface Payment {
  id: string; 
  user_id: string; 
  application_id?: string | null;
  fee_id: string | null; 
  amount: number; 
  payment_date: string; 
  status: PaymentStatus; // This will now correctly use the enum above
  receipt_url?: string | null;
  receipt_filename?: string | null;
  transaction_reference?: string | null;
  created_at: string; 
  updated_at: string; 
  admin_comment?: string | null;
  processed_by_admin_id?: string | null; 
  processed_at?: string | null; 
  fees?: Fee | null; 
}

export interface NewPaymentFormData {
  fee_id: string; 
  receiptFile?: File | null;
  transaction_reference?: string;
}

export interface PaymentAssociatedUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string;
}

export interface AdminPaymentView extends Payment {
  user: PaymentAssociatedUser; 
}

export interface AdminUpdatePaymentPayload {
  status: PaymentStatus; // This will now correctly use the enum above
  admin_comment?: string;
}

export interface AdminPaymentsFiltersType {
  status: PaymentStatus | ''; // This will now correctly use the enum above
  fee_id?: string | ''; 
  feeNameSearch?: string; 
  userSearch: string; 
  dateFrom: string;
  dateTo: string;
}