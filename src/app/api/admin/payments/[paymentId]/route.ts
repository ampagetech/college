// src/app/api/admin/payments/[paymentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';
import { PaymentStatus, AdminUpdatePaymentPayload } from '@/types/payment'; // Using the extended payment.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const consolePrefix = '[API PUT /api/admin/payments/[paymentId]]';
  const { paymentId } = params;
  console.log(`${consolePrefix} Request received for payment ID: ${paymentId}`);

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user is an admin
  if (String(token.role).toLowerCase() !== ROLES.ADMIN.toLowerCase()) {
    console.warn(`${consolePrefix} Forbidden: User ${token.sub} with role ${token.role} is not an admin.`);
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  const adminUserId = token.sub; // ID of the admin performing the action
  console.log(`${consolePrefix} Admin user ${adminUserId} authenticated.`);


  if (!paymentId) {
    console.warn(`${consolePrefix} Bad Request: Payment ID is required.`);
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
  }

  let payload: AdminUpdatePaymentPayload;
  try {
    payload = await request.json();
    console.log(`${consolePrefix} Parsed payload for payment ${paymentId}:`, payload);
  } catch (e) {
    console.error(`${consolePrefix} Bad Request: Invalid JSON payload.`, e);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { status, admin_comment } = payload;

  // Validate status
  if (!status || !Object.values(PaymentStatus).includes(status)) {
    console.warn(`${consolePrefix} Bad Request: Invalid status value '${status}' for payment ${paymentId}.`);
    return NextResponse.json({ error: 'Invalid payment status value.' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    const updateData: {
      status: PaymentStatus;
      admin_comment?: string | null;
      processed_by_admin_id: string;
      processed_at: string;
      updated_at: string; // Manually set updated_at, or rely on DB trigger
    } = {
      status: status,
      processed_by_admin_id: adminUserId,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), // If you don't have a DB trigger for updated_at
    };

    if (admin_comment !== undefined) { // Check for undefined to allow clearing the comment
      updateData.admin_comment = admin_comment === "" ? null : admin_comment; // Set to null if empty string
    }
    
    console.log(`${consolePrefix} Attempting to update payment ${paymentId} with data:`, updateData);

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select() // Select the updated row to return it
      .single(); // Expect a single row to be updated and returned

    if (error) {
      if (error.code === 'PGRST116') { // Error when no row is found (or more than one, but eq('id') should prevent that)
        console.warn(`${consolePrefix} Not Found: Payment with ID ${paymentId} not found.`);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      console.error(`${consolePrefix} Supabase error updating payment ${paymentId}:`, error);
      throw error; // Rethrow to be caught by the general catch block
    }
    
    if (!data) { // Should be caught by PGRST116, but as a fallback
        console.warn(`${consolePrefix} Not Found: Payment with ID ${paymentId} not found after update attempt (no data returned).`);
        return NextResponse.json({ error: 'Payment not found or update failed' }, { status: 404 });
    }

    console.log(`${consolePrefix} Payment ${paymentId} updated successfully by admin ${adminUserId}.`);
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error(`${consolePrefix} General error processing payment ${paymentId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update payment' }, { status: 500 });
  }
}