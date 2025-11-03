// src/app/api/payments/[paymentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { PaymentStatus } from '@/types/payment';
import { PostgrestError } from '@supabase/supabase-js';

const SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME = process.env.SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME;
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Types for better type safety
interface PaymentRecord {
  id: string;
  user_id: string;
  status: PaymentStatus;
  receipt_url: string | null;
  receipt_filename: string | null;
  transaction_reference: string | null;
}

interface PaymentWithFees extends PaymentRecord {
  fees: {
    id: string;
    name: string;
    description: string;
    amount: number;
    is_active: boolean;
  }[];
}

interface UpdatePayload {
  transaction_reference?: string | null;
  receipt_url?: string;
  receipt_filename?: string;
  status?: PaymentStatus;
  updated_at?: string;
}

// GET HANDLER FOR FETCHING STATUS
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
): Promise<NextResponse> {
  const consolePrefix = `[API GET /api/payments/${params.paymentId}/status-check]`;
  const { paymentId } = params;
  console.log(`${consolePrefix} Request to fetch status for payment ID: ${paymentId}`);

  if (!paymentId) {
    console.warn(`${consolePrefix} Bad Request: Payment ID is required.`);
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized for payment ${paymentId}: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.sub;

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('id', paymentId)
      .eq('user_id', userId) // Ensure user can only check their own payment status
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No row found
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      throw error; // Rethrow to be caught by general catch
    }

    return NextResponse.json({ status: data.status as PaymentStatus }, { status: 200 });

  } catch (error: unknown) {
    // Check for "fetch failed" which can indicate Supabase client issues (URL/key missing)
    if (error instanceof Error && error.message.toLowerCase().includes('fetch failed')) {
      return NextResponse.json({ error: 'Failed to connect to the database service.' }, { status: 503 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment status';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT HANDLER - Fixed with proper types and return type
export async function PUT(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
): Promise<NextResponse> {
  const consolePrefix = `[API PUT /api/payments/${params.paymentId}]`;
  console.log(`${consolePrefix} === PUT REQUEST STARTED ===`);

  if (!SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME) {
    console.error(`${consolePrefix} CRITICAL: SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME is not defined.`);
    return NextResponse.json({ error: "Server configuration error: Payment receipt storage not configured." }, { status: 500 });
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const paymentId = params.paymentId;
  const supabase = createClient();

  try {
    // 1. Fetch the existing payment to verify ownership and status
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('id, user_id, status, receipt_url, receipt_filename, transaction_reference')
      .eq('id', paymentId)
      .single() as { data: PaymentRecord | null; error: PostgrestError | null };

    if (fetchError) {
      console.error(`${consolePrefix} Supabase error fetching payment:`, fetchError);
      if (fetchError.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
      }
      if (fetchError.message.toLowerCase().includes('fetch failed')) {
        return NextResponse.json({ error: 'Failed to connect to the database to retrieve payment details.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to retrieve payment details.' }, { status: 500 });
    }

    // Type assertion with proper validation
    const payment = existingPayment as PaymentRecord;

    if (payment.user_id !== userId) {
      console.warn(`${consolePrefix} Forbidden: User ${userId} attempted to edit payment ${paymentId} owned by ${payment.user_id}.`);
      return NextResponse.json({ error: 'Forbidden: You do not own this payment.' }, { status: 403 });
    }

    // Use PaymentStatus.CONFIRMED and PaymentStatus.FAILED based on corrected enum
    if (payment.status === PaymentStatus.CONFIRMED || payment.status === PaymentStatus.FAILED) {
      console.warn(`${consolePrefix} Forbidden: Attempt to edit a ${payment.status} payment ${paymentId}.`);
      return NextResponse.json({ error: `Cannot edit a payment with status '${payment.status}'.` }, { status: 403 });
    }
    // Only PENDING payments can be edited by the user.

    // 2. Parse FormData
    const formData = await request.formData();
    const newTransactionReference = formData.get('transaction_reference') as string | null;
    const receiptFile = formData.get('receiptFile') as File | null;

    const updatePayload: UpdatePayload = {};

    // 3. Handle Transaction Reference Update
    // Only update if newTransactionReference is actually different from current one
    const currentTxRef = payment.transaction_reference ?? '';
    const newTxRef = newTransactionReference?.trim() ?? '';

    if (newTransactionReference !== null && newTxRef !== currentTxRef) {
      updatePayload.transaction_reference = newTxRef === '' ? null : newTxRef;
    }

    // 4. Handle Receipt File Upload (if provided)
    if (receiptFile) {
      console.log(`${consolePrefix} New receipt file provided: ${receiptFile.name}, size: ${String(receiptFile.size)}`);
      if (receiptFile.size > MAX_RECEIPT_SIZE_BYTES) {
        return NextResponse.json({ error: `Receipt file size exceeds ${String(MAX_RECEIPT_SIZE_BYTES / (1024 * 1024))}MB.` }, { status: 413 });
      }
      if (receiptFile.size === 0) {
        return NextResponse.json({ error: `Receipt file is empty.` }, { status: 400 });
      }

      const fileExtension = receiptFile.name.split('.').pop()?.toLowerCase() || 'bin';
      const storagePath = `${userId}/${paymentId}/receipt.${fileExtension}`; 

      console.log(`${consolePrefix} Uploading new receipt to: ${SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME}/${storagePath}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME)
        .upload(storagePath, receiptFile, {
          cacheControl: '3600',
          upsert: true, 
          contentType: receiptFile.type,
        });

      if (uploadError) {
        console.error(`${consolePrefix} Supabase storage upload error:`, uploadError);
        if (uploadError.message.toLowerCase().includes('fetch failed')) {
          return NextResponse.json({ error: 'Failed to connect to storage to upload receipt.' }, { status: 503 });
        }
        throw new Error(uploadError.message || 'Failed to upload new receipt.');
      }
      
      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME)
        .getPublicUrl(uploadData.path);
      
      const receiptUrlToStore = publicUrlData.publicUrl;
      const receiptFilenameToStore = receiptFile.name; // Store the original filename

      updatePayload.receipt_url = receiptUrlToStore;
      updatePayload.receipt_filename = receiptFilenameToStore;
      // If receipt changes, status should remain PENDING (or be set to PENDING if it wasn't for some reason)
      // Admins will re-evaluate. User edits shouldn't change status from PENDING.
      updatePayload.status = PaymentStatus.PENDING; 
      console.log(`${consolePrefix} New receipt uploaded, URL: ${receiptUrlToStore}, Filename: ${receiptFilenameToStore}, Status remains PENDING.`);
    }

    // 5. Perform Update if changes exist
    if (Object.keys(updatePayload).length === 0) {
      console.log(`${consolePrefix} No changes detected for payment ${paymentId}.`);
      // Return existing payment data as if it were "updated" with no changes
      // This requires fetching the fees relationship as well for consistency with actual update response
      const { data: currentPaymentWithFees, error: feeFetchError } = await supabase
        .from('payments')
        .select(`*, fees (id, name, description, amount, is_active)`)
        .eq('id', paymentId)
        .single() as { data: PaymentWithFees | null; error: PostgrestError | null };

      if (feeFetchError) {
        console.error(`${consolePrefix} Error fetching payment with fees for no-change response:`, feeFetchError);
        return NextResponse.json({ message: 'No changes detected, but failed to fetch full payment details.', payment: existingPayment }, { status: 200 });
      }
      
      // Type assertion for the response with fees
      const paymentWithFees = currentPaymentWithFees as PaymentWithFees;
      return NextResponse.json({ message: 'No changes detected.', payment: paymentWithFees }, { status: 200 });
    }
    
    updatePayload.updated_at = new Date().toISOString(); // Always update timestamp if any change

    console.log(`${consolePrefix} Update payload for payment ${paymentId}:`, updatePayload);

    const { data: updatedPaymentData, error: updateError } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', paymentId)
      .select(`*, fees (id, name, description, amount, is_active)`)
      .single() as { data: PaymentWithFees | null; error: PostgrestError | null };

    if (updateError) {
      console.error(`${consolePrefix} Supabase error updating payment:`, updateError);
      if (updateError.message.toLowerCase().includes('fetch failed')) {
        return NextResponse.json({ error: 'Failed to connect to the database to update payment.' }, { status: 503 });
      }
      throw new Error(updateError.message || 'Failed to update payment record.');
    }

    // Type assertion for the updated payment response
    const updatedPayment = updatedPaymentData as PaymentWithFees;

    console.log(`${consolePrefix} === PUT REQUEST COMPLETED SUCCESSFULLY for payment ID ${paymentId} ===`);
    return NextResponse.json({ message: 'Payment updated successfully.', payment: updatedPayment }, { status: 200 });

  } catch (error: unknown) {
    console.error(`${consolePrefix} === CRITICAL ERROR IN PAYMENT UPDATE PROCESS ===`, error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update payment';
    if (errorMessage.toLowerCase().includes('fetch failed')) {
      return NextResponse.json({ error: 'Failed to update payment due to a connection issue. Please try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

