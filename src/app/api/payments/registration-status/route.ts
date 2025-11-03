// src/app/api/payments/registration-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { PaymentStatus } from '@/types/payment'; // Ensure this path is correct

const REGISTRATION_FEE_NAME = 'Registration Fee'; // Ensure this is EXACTLY 'Registration Fee'

const consolePrefix = '[API GET /api/payments/registration-status]';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const supabase = createClient();

  try {
    console.log(`${consolePrefix} FINAL VERSION: Checking registration fee status for User ID: ${userId}`);

    // --- Step 1: Get the ID of the Registration Fee ---
    console.log(`${consolePrefix} FINAL VERSION: Fetching Registration Fee ID by name: '${REGISTRATION_FEE_NAME}'`);
    const { data: feeData, error: feeError } = await supabase
      .from('fees')
      .select('id, name') // Only need id and name
      .eq('name', REGISTRATION_FEE_NAME)
      .eq('is_active', true)
      .single();

    if (feeError) {
      console.error(`${consolePrefix} FINAL VERSION: Supabase error fetching registration fee ID for '${REGISTRATION_FEE_NAME}':`, feeError);
      return NextResponse.json({ error: 'Server configuration error: Could not identify registration fee type.', details: feeError.message }, { status: 500 });
    }
    if (!feeData) {
      console.error(`${consolePrefix} FINAL VERSION: Configuration error: Registration Fee named '${REGISTRATION_FEE_NAME}' not found or not active.`);
      return NextResponse.json({ error: 'Server configuration error: Registration fee type not defined.' }, { status: 500 });
    }
    const registrationFeeId = feeData.id;
    console.log(`${consolePrefix} FINAL VERSION: Found Registration Fee ID: ${registrationFeeId} (Name: ${feeData.name})`);

    // --- Step 2: Query the payments table ---
    console.log(`${consolePrefix} FINAL VERSION: Querying payments for User ID: ${userId}, Fee ID: ${registrationFeeId}, Status: '${PaymentStatus.CONFIRMED}'`);
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .select('id') // We only need to know if it exists
      .eq('user_id', userId)
      .eq('fee_id', registrationFeeId)
      .eq('status', PaymentStatus.CONFIRMED)
      .limit(1)
      .maybeSingle();

    // Optional: Log raw result for sanity check during testing
    // console.log(`${consolePrefix} FINAL VERSION: Supabase payments query raw result:`, JSON.stringify({ data: paymentRecord, error: paymentError }, null, 2));

    if (paymentError) {
      console.error(`${consolePrefix} FINAL VERSION: Supabase error querying payments:`, paymentError);
      return NextResponse.json({ error: 'Failed to check payment status.', details: paymentError.message }, { status: 500 });
    }

    if (paymentRecord) {
      console.log(`${consolePrefix} FINAL VERSION: SUCCESS - Verified registration payment found for User ID: ${userId}.`);
      return NextResponse.json({ hasVerifiedRegistrationPayment: true });
    } else {
      console.log(`${consolePrefix} FINAL VERSION: INFO - No verified registration payment found for User ID ${userId} matching criteria.`);
      return NextResponse.json({ hasVerifiedRegistrationPayment: false });
    }

  } catch (err: any) {
    console.error(`${consolePrefix} FINAL VERSION: CRITICAL ERROR:`, err);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: err.message }, { status: 500 });
  }
}