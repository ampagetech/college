// src/app/api/payments/check-validity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server'; // Assuming this is your RLS-aware client helper

interface CheckValidityRequest {
  fee_id: string;
}

// Define the expected shape of a payment object fetched from Supabase, including the joined 'fees' data
interface FetchedPayment {
  id: string;
  fee_id: string;
  status: string; // Assuming status is always a string
  payment_date: string; // Assuming payment_date is a string (ISO format)
  fees: { // This corresponds to the joined 'fees' table
    id: string;
    name: string;
    amount: number; // Assuming amount is a number
  } | null; // The join might not find a fee, so it could be null
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  requiredFees?: string[]; // Names of fees
  duplicatePayment?: {
    id: string;
    fee_name: string;
    status: string;
    payment_date: string;
  };
}

// REMOVED: FEE_TYPES_PLACEHOLDERS as it was unused.
// If you decide to use stable fee IDs later, you can reintroduce a similar concept.

export async function POST(request: NextRequest) {
  const consolePrefix = '[API POST /api/payments/check-validity]';
  const logPrefix = '//...Eligibility LOGGG ...';

  console.log(`${consolePrefix} ${logPrefix} Received request.`);

  try {
    const body: CheckValidityRequest = await request.json();
    const { fee_id } = body;

    console.log(`${consolePrefix} ${logPrefix} Request Body:`, body);

    if (!fee_id) {
      console.error(`${consolePrefix} ${logPrefix} VALIDATION FAIL: Missing fee_id in request body.`);
      return NextResponse.json(
        { error: 'Fee ID is required' },
        { status: 400 }
      );
    }
    console.log(`${consolePrefix} ${logPrefix} Attempting to validate eligibility for making a new payment for Fee ID: ${fee_id}`);

    // --- 1. AUTHENTICATION ---
    console.log(`${consolePrefix} ${logPrefix} Step 1: Authenticating user.`);
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
      console.error(`${consolePrefix} ${logPrefix} AUTH FAIL: Unauthorized. No token or subject (user ID).`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    console.log(`${consolePrefix} ${logPrefix} Auth Success. User ID: ${userId}`);
    const supabase = createClient(); // RLS-aware client

    // --- 2. FETCH DETAILS OF THE FEE BEING PAID FOR ---
    console.log(`${consolePrefix} ${logPrefix} Step 2: Fetching details for the target Fee ID: ${fee_id}.`);
    const { data: feeData, error: feeError } = await supabase
      .from('fees')
      .select('id, name, amount')
      .eq('id', fee_id)
      .single();

    if (feeError || !feeData) {
      console.error(`${consolePrefix} ${logPrefix} FETCH FAIL: Fee not found or error fetching fee with ID ${fee_id}. Error:`, feeError);
      return NextResponse.json(
        { error: 'Invalid fee ID or failed to fetch fee details.' },
        { status: 400 }
      );
    }
    console.log(`${consolePrefix} ${logPrefix} Target Fee Details:`, feeData);

    // --- 3. FETCH ALL EXISTING PAYMENTS FOR THE USER ---
    console.log(`${consolePrefix} ${logPrefix} Step 3: Fetching all existing payments for User ID: ${userId}.`);
    // Typed the query result explicitly
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        fee_id,
        status,
        payment_date,
        fees (
          id,
          name,
          amount
        )
      `)
      .eq('user_id', userId)
      .returns<FetchedPayment[]>(); // Explicitly type the expected return

    if (paymentsError) {
      console.error(`${consolePrefix} ${logPrefix} FETCH FAIL: Error fetching existing payments for user ${userId}. Error:`, paymentsError);
      return NextResponse.json(
        { error: 'Failed to check existing payments' },
        { status: 500 }
      );
    }
    console.log(`${consolePrefix} ${logPrefix} Found ${existingPayments?.length || 0} existing payments for user ${userId}. Details:`, JSON.stringify(existingPayments, null, 2));

    // --- RULE 1: CHECK FOR DUPLICATE PAYMENT FOR THE CURRENT fee_id ---
    console.log(`${consolePrefix} ${logPrefix} Rule 1: Checking for duplicate payment for the target Fee ID: ${fee_id} (${feeData.name}).`);
    // Now `payment.fee_id` etc. will be correctly typed thanks to FetchedPayment
    const duplicatePayment = existingPayments?.find(payment => payment.fee_id === fee_id);

    if (duplicatePayment) {
      console.log(`${consolePrefix} ${logPrefix} DUPLICATE DETECTED: An existing payment was found for Fee ID ${fee_id}.`);
      console.log(`${consolePrefix} ${logPrefix} Duplicate Payment Details:`, JSON.stringify(duplicatePayment, null, 2));
      const result: ValidationResult = {
        isValid: false,
        message: `You already have a payment record for '${feeData.name}'. Status: ${duplicatePayment.status}.`, // `duplicatePayment.status` is now typed
        duplicatePayment: {
          id: duplicatePayment.id, // `duplicatePayment.id` is now typed
          fee_name: duplicatePayment.fees?.name || feeData.name || 'Unknown Fee',
          status: duplicatePayment.status,
          payment_date: duplicatePayment.payment_date // `duplicatePayment.payment_date` is now typed
        }
      };
      console.log(`${consolePrefix} ${logPrefix} Rule 1 Result: VALIDATION FAIL (Duplicate). Response:`, result);
      return NextResponse.json(result);
    }
    console.log(`${consolePrefix} ${logPrefix} Rule 1 Result: No duplicate payment found for Fee ID ${fee_id}. Proceeding.`);

    // --- 4. FETCH ALL ACTIVE FEES (for prerequisite checks) ---
    console.log(`${consolePrefix} ${logPrefix} Step 4: Fetching all active fees from the system for prerequisite checks.`);
    const { data: allFees, error: allFeesError } = await supabase
      .from('fees')
      .select('id, name') // Only select what you need
      .eq('is_active', true);

    if (allFeesError || !allFees) {
      console.error(`${consolePrefix} ${logPrefix} FETCH FAIL: Error fetching all active fees. Error:`, allFeesError);
      return NextResponse.json(
        { error: 'Failed to fetch system fees for validation' },
        { status: 500 }
      );
    }
    console.log(`${consolePrefix} ${logPrefix} Found ${allFees?.length || 0} active fees in the system. Details:`, JSON.stringify(allFees, null, 2));

    // --- 5. IDENTIFY KEY FEE TYPES BY NAME (Case-Insensitive) ---
    console.log(`${consolePrefix} ${logPrefix} Step 5: Identifying key fee types (Registration, Acceptance, Tuition) by name from all active fees.`);
    const registrationFee = allFees.find(fee =>
      fee.name.toLowerCase().includes('registration')
    );
    const acceptanceFee = allFees.find(fee =>
      fee.name.toLowerCase().includes('acceptance')
    );
    const tuitionFee = allFees.find(fee =>
      fee.name.toLowerCase().includes('tuition')
    );
    console.log(`${consolePrefix} ${logPrefix} Identified Registration Fee by name:`, registrationFee || 'Not Found/Inactive');
    console.log(`${consolePrefix} ${logPrefix} Identified Acceptance Fee by name:`, acceptanceFee || 'Not Found/Inactive');
    console.log(`${consolePrefix} ${logPrefix} Identified Tuition Fee by name:`, tuitionFee || 'Not Found/Inactive');


    // Get IDs of already paid fees for easier checking in rules below
    const paidFeesWithStatus = existingPayments?.map(p => ({id: p.fee_id, name: p.fees?.name || 'N/A', status: p.status })) || [];
    console.log(`${consolePrefix} ${logPrefix} User's existing paid Fees (with status for context):`, JSON.stringify(paidFeesWithStatus, null, 2));


    // --- RULE 2: ACCEPTANCE FEE PREREQUISITES ---
    console.log(`${consolePrefix} ${logPrefix} Rule 2: Checking prerequisites if target fee is Acceptance Fee.`);
    if (acceptanceFee && fee_id === acceptanceFee.id) {
      console.log(`${consolePrefix} ${logPrefix} Target fee IS Acceptance Fee ('${acceptanceFee.name}', ID: ${acceptanceFee.id}). Checking for Registration Fee payment.`);
      let isRegistrationPaid = false;
      if (registrationFee) {
        const registrationPayment = existingPayments?.find(p => p.fee_id === registrationFee.id && p.status?.toLowerCase() === 'confirmed');
        isRegistrationPaid = !!registrationPayment;
        console.log(`${consolePrefix} ${logPrefix} Registration Fee ('${registrationFee.name}', ID: ${registrationFee.id}) payment status: ${isRegistrationPaid ? 'Confirmed' : 'Not Confirmed/Not Found'}. Details of payment if found:`, registrationPayment || 'N/A');
      } else {
        console.log(`${consolePrefix} ${logPrefix} Registration Fee type not found/defined in system. Cannot enforce prerequisite.`);
      }

      if (registrationFee && !isRegistrationPaid) {
        console.log(`${consolePrefix} ${logPrefix} Rule 2 Result: VALIDATION FAIL. Missing confirmed Registration Fee ('${registrationFee.name}') payment for Acceptance Fee.`);
        const result: ValidationResult = {
          isValid: false,
          message: `You must have a confirmed 'Registration Fee' payment before paying the '${acceptanceFee.name}'.`,
          requiredFees: [registrationFee.name]
        };
        return NextResponse.json(result);
      }
      console.log(`${consolePrefix} ${logPrefix} Rule 2 Result: Acceptance Fee prerequisites met (or not applicable).`);
    } else {
      console.log(`${consolePrefix} ${logPrefix} Rule 2: Not an Acceptance Fee, or Acceptance Fee type not defined. Skipping this rule.`);
    }

    // --- RULE 3: TUITION FEE PREREQUISITES ---
    console.log(`${consolePrefix} ${logPrefix} Rule 3: Checking prerequisites if target fee is Tuition Fee.`);
    if (tuitionFee && fee_id === tuitionFee.id) {
      console.log(`${consolePrefix} ${logPrefix} Target fee IS Tuition Fee ('${tuitionFee.name}', ID: ${tuitionFee.id}). Checking for Registration and Acceptance Fee payments.`);
      const missingFees: string[] = [];
      let isRegistrationPaid = false;
      let isAcceptancePaid = false;

      if (registrationFee) {
        const registrationPayment = existingPayments?.find(p => p.fee_id === registrationFee.id && p.status?.toLowerCase() === 'confirmed');
        isRegistrationPaid = !!registrationPayment;
        console.log(`${consolePrefix} ${logPrefix} Registration Fee ('${registrationFee.name}', ID: ${registrationFee.id}) payment status for Tuition: ${isRegistrationPaid ? 'Confirmed' : 'Not Confirmed/Not Found'}.`);
        if (!isRegistrationPaid) missingFees.push(registrationFee.name);
      } else {
        console.log(`${consolePrefix} ${logPrefix} Registration Fee type not found/defined. Cannot enforce as prerequisite for Tuition.`);
      }

      if (acceptanceFee) {
        const acceptancePayment = existingPayments?.find(p => p.fee_id === acceptanceFee.id && p.status?.toLowerCase() === 'confirmed');
        isAcceptancePaid = !!acceptancePayment;
        console.log(`${consolePrefix} ${logPrefix} Acceptance Fee ('${acceptanceFee.name}', ID: ${acceptanceFee.id}) payment status for Tuition: ${isAcceptancePaid ? 'Confirmed' : 'Not Confirmed/Not Found'}.`);
        if (!isAcceptancePaid) missingFees.push(acceptanceFee.name);
      } else {
        console.log(`${consolePrefix} ${logPrefix} Acceptance Fee type not found/defined. Cannot enforce as prerequisite for Tuition.`);
      }

      if (missingFees.length > 0) {
        console.log(`${consolePrefix} ${logPrefix} Rule 3 Result: VALIDATION FAIL. Missing confirmed payments for Tuition Fee. Missing: ${missingFees.join(', ')}.`);
        const result: ValidationResult = {
          isValid: false,
          message: `You must have confirmed payments for the following fees before paying the '${tuitionFee.name}': ${missingFees.join(' and ')}.`,
          requiredFees: missingFees
        };
        return NextResponse.json(result);
      }
      console.log(`${consolePrefix} ${logPrefix} Rule 3 Result: Tuition Fee prerequisites met (or not applicable).`);
    } else {
      console.log(`${consolePrefix} ${logPrefix} Rule 3: Not a Tuition Fee, or Tuition Fee type not defined. Skipping this rule.`);
    }

    // --- FINAL VALIDATION SUCCESS ---
    console.log(`${consolePrefix} ${logPrefix} ALL CHECKS PASSED: Payment for Fee ID ${fee_id} ('${feeData.name}') is valid and can be processed.`);
    const result: ValidationResult = {
      isValid: true,
      message: 'Payment is valid and can be processed.'
    };
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`${consolePrefix} ${logPrefix} UNHANDLED ERROR in API:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during payment validation' },
      { status: 500 }
    );
  }
}