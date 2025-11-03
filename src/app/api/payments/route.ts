// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { PaymentStatus, Fee } from '@/types/payment';

const SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME = process.env.SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPT_SIZE_MB = 5;
const MAX_DAILY_PAYMENTS = 5;

// GET all payments for the authenticated user (MODIFIED TO JOIN FEES)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const consolePrefix = '[API GET /api/payments]';

  // --- Environment Variable Validation ---
  if (!NEXTAUTH_SECRET) {
    console.error(`${consolePrefix} CRITICAL: NEXTAUTH_SECRET is not defined.`);
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const supabase = createClient();

  try {
    console.log(`${consolePrefix} Fetching payments for User ID: ${userId}`);
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        fees (
          id,
          name,
          description,
          amount,
          is_active
        )
      `)
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error(`${consolePrefix} Supabase error fetching payments:`, error);
      return NextResponse.json({
        error: 'Failed to fetch payments due to a database query error.',
        details: error
      }, { status: 500 });
    }

    const paymentCount = data.length;
    console.log(`${consolePrefix} Successfully fetched ${paymentCount.toString()} payments.`);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error(`${consolePrefix} General error (e.g., createClient issue, token issue):`, error);
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('fetch failed')) {
            return NextResponse.json({ error: 'Failed to connect to the database. Please check server configuration.' }, { status: 503 }); // Service Unavailable
        }
        return NextResponse.json({ error: error.message || 'Failed to fetch payments due to an unexpected server error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred while fetching payments.' }, { status: 500 });
  }
}

// POST a new payment (MODIFIED TO USE fee_id)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const consolePrefix = '[API POST /api/payments]';
  console.log(`${consolePrefix} === POST REQUEST STARTED ===`);

  // --- Environment Variable Validation ---
  if (!SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME) {
    console.error(`${consolePrefix} CRITICAL: SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME is not defined.`);
    return NextResponse.json({ error: "Server configuration error: Payment receipt storage not configured." }, { status: 500 });
  }
  if (!NEXTAUTH_SECRET) {
    console.error(`${consolePrefix} CRITICAL: NEXTAUTH_SECRET is not defined.`);
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const supabase = createClient();

  // --- Daily Upload Limit Check ---
  try {
    const now = new Date();
    const todayStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
    const tomorrowStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)).toISOString();

    const { count, error: countError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('payment_date', todayStartUTC)
      .lt('payment_date', tomorrowStartUTC);

    if (countError) {
      console.error(`${consolePrefix} Supabase error counting payments for User ID ${userId}:`, countError);
      // Let the generic catch block handle the message for consistency.
      throw new Error(countError.message || 'Failed to verify payment limit due to a server error processing the request.');
    }

    if (count !== null && count >= MAX_DAILY_PAYMENTS) {
      return NextResponse.json(
        { error: `You have reached the daily limit of ${MAX_DAILY_PAYMENTS.toString()} payment uploads. Please try again tomorrow.` },
        { status: 429 }
      );
    }
  } catch (err: unknown) {
    console.error(`${consolePrefix} Error during daily limit check for User ID ${userId}:`, err);
    if (err instanceof Error) {
        if (err.message.toLowerCase().includes('fetch failed')) {
            return NextResponse.json({ error: 'Could not process payment: Failed to connect to the database while checking limits.' }, { status: 503 });
        }
        return NextResponse.json({ error: err.message || 'Could not process payment due to an internal server error while checking limits.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred while checking user payment limits.' }, { status: 500 });
  }
  // --- End Daily Upload Limit Check ---

  let paymentRecordId: string | null = null;
  try {
    const formData = await request.formData();
    const feeId = formData.get('fee_id') as string | null;
    const transactionReference = formData.get('transaction_reference') as string | null;
    const receiptFile = formData.get('receiptFile') as File | null;

    const feeIdDisplay = feeId ?? 'N/A';
    const transactionRefDisplay = transactionReference ?? 'N/A';
    const fileNameDisplay = receiptFile?.name ?? 'N/A';
    console.log(`${consolePrefix} Passed daily limit. Processing data - Fee ID: ${feeIdDisplay}, Ref: ${transactionRefDisplay}, File: ${fileNameDisplay}`);

    if (!feeId) {
      return NextResponse.json({ error: 'Fee ID is required.' }, { status: 400 });
    }

    // Fetch the fee details from the database
    const { data: feeData, error: feeError } = await supabase
      .from('fees')
      .select('id, name, amount, is_active')
      .eq('id', feeId)
      .single<Fee>();

    if (feeError) {
      const feeIdForLog = feeId || 'unknown';
      console.error(`${consolePrefix} Error fetching fee details for ID ${feeIdForLog}:`, feeError);
      if (feeError.message.toLowerCase().includes('fetch failed')) {
         return NextResponse.json({ error: 'Failed to retrieve fee details due to a database connection issue.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Invalid or inactive Fee ID provided.' }, { status: 400 });
    }

    if (!feeData.is_active) {
        return NextResponse.json({ error: 'The selected fee is currently not active.' }, { status: 400 });
    }

    const amountFromFee = feeData.amount;
    let receiptUrl: string | null = null;
    let receiptFilename: string | null = null;
    const paymentDateForNewRecord = new Date().toISOString();

    // Initial payment record insertion
    const { data: paymentInsertData, error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        fee_id: feeId,
        amount: amountFromFee,
        status: 'pending' as PaymentStatus,
        payment_date: paymentDateForNewRecord,
        transaction_reference: transactionReference || null,
      })
      .select('id')
      .single();

    if (paymentInsertError) {
      console.error(`${consolePrefix} Error inserting initial payment record:`, paymentInsertError);
      if (paymentInsertError.message.toLowerCase().includes('fetch failed')) {
         throw new Error('Failed to create payment record due to a database connection issue.');
      }
      throw new Error(paymentInsertError.message || 'Failed to create payment record.');
    }

    paymentRecordId = paymentInsertData.id as string;
    console.log(`${consolePrefix} Initial payment record created with ID: ${paymentRecordId}`);

    // Receipt file handling (if provided)
    if (receiptFile) {
      if (receiptFile.size > MAX_RECEIPT_SIZE_BYTES) {
        console.warn(`${consolePrefix} Receipt file size too large for payment ID ${paymentRecordId}. Deleting record.`);
        await supabase.from('payments').delete().eq('id', paymentRecordId); // Cleanup
        return NextResponse.json({ error: `Receipt file size exceeds ${MAX_RECEIPT_SIZE_MB.toString()}MB.` }, { status: 413 });
      }
      if (receiptFile.size === 0) {
        console.warn(`${consolePrefix} Receipt file is empty for payment ID ${paymentRecordId}. Deleting record.`);
        await supabase.from('payments').delete().eq('id', paymentRecordId); // Cleanup
        return NextResponse.json({ error: `Receipt file is empty.` }, { status: 400 });
      }

      const fileExtension = receiptFile.name.split('.').pop()?.toLowerCase() || 'bin';
      const storagePath = `${userId}/${paymentRecordId}/receipt.${fileExtension}`;
      receiptFilename = receiptFile.name;

      console.log(`${consolePrefix} Uploading receipt to: ${SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME}/${storagePath}`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME)
        .upload(storagePath, receiptFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: receiptFile.type,
        });

      if (uploadError) {
        console.error(`${consolePrefix} Supabase storage upload error for payment ID ${paymentRecordId}:`, uploadError);
        console.warn(`${consolePrefix} Deleting payment record ${paymentRecordId} due to receipt upload error.`);
        await supabase.from('payments').delete().eq('id', paymentRecordId); // Cleanup
        if (uploadError.message.toLowerCase().includes('fetch failed')) {
            throw new Error('Failed to upload receipt due to a storage connection issue.');
        }
        throw new Error(uploadError.message || 'Failed to upload receipt.');
      }

      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_PAYMENT_RECEIPTS_BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      receiptUrl = publicUrlData.publicUrl;
      const receiptUrlDisplay = receiptUrl;
      console.log(`${consolePrefix} Receipt uploaded for payment ID ${paymentRecordId}, URL: ${receiptUrlDisplay}`);

      // Update payment record with receipt URL
      const { error: updateError } = await supabase
        .from('payments')
        .update({ receipt_url: receiptUrl, receipt_filename: receiptFilename })
        .eq('id', paymentRecordId);

      if (updateError) {
        console.error(`${consolePrefix} Error updating payment ${paymentRecordId} with receipt URL:`, updateError);
        if (updateError.message.toLowerCase().includes('fetch failed')) {
            throw new Error('Failed to finalize payment record with receipt due to a database connection issue.');
        }
        throw new Error(updateError.message || 'Failed to finalize payment record with receipt.');
      }
      console.log(`${consolePrefix} Payment record ${paymentRecordId} updated with receipt info.`);
    }

    console.log(`${consolePrefix} === POST REQUEST COMPLETED SUCCESSFULLY for payment ID ${paymentRecordId} ===`);
    return NextResponse.json({ message: 'Payment submitted successfully.', paymentId: paymentRecordId }, { status: 201 });

  } catch (error: unknown) {
    console.error(`${consolePrefix} === CRITICAL ERROR IN PAYMENT CREATION PROCESS (after limit check) ===`, error);
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('fetch failed')) {
            return NextResponse.json({ error: 'Failed to submit payment due to a connection issue with the server. Please try again later.' }, { status: 503 });
        }
        return NextResponse.json({ error: error.message || 'Failed to submit payment' }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred while submitting the payment.' }, { status: 500 });
  }
}