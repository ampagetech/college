// src/app/api/admin/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';
import { DocumentStatus, AdminUpdateDocumentPayload } from '@/types/document';

export async function PUT(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const consolePrefix = '[API PUT /api/admin/documents/[documentId]]';
  const { documentId } = params;
  console.log(`${consolePrefix} Request received for document ID: ${documentId}`);

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (String(token.role).toLowerCase() !== ROLES.ADMIN.toLowerCase()) {
    console.warn(`${consolePrefix} Forbidden: User ${token.sub} with role ${token.role} is not an admin.`);
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  const adminUserId = token.sub; // ID of the admin performing the action
  console.log(`${consolePrefix} Admin user ${adminUserId} authenticated.`);


  if (!documentId) {
    console.warn(`${consolePrefix} Bad Request: Document ID is required.`);
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  let payload: AdminUpdateDocumentPayload;
  try {
    payload = await request.json();
    console.log(`${consolePrefix} Parsed payload for document ${documentId}:`, payload);
  } catch (e) {
    console.error(`${consolePrefix} Bad Request: Invalid JSON payload.`, e);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { status, admin_comment } = payload;

  if (!status || !Object.values(DocumentStatus).includes(status)) {
    console.warn(`${consolePrefix} Bad Request: Invalid status value '${status}' for document ${documentId}.`);
    return NextResponse.json({ error: 'Invalid document status value.' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    const updateData: {
      status: DocumentStatus;
      admin_comment?: string | null;
      reviewed_by_admin_id: string;
      reviewed_at: string;
      updated_at: string;
    } = {
      status: status,
      reviewed_by_admin_id: adminUserId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (admin_comment !== undefined) {
      updateData.admin_comment = admin_comment === "" ? null : admin_comment;
    }
    
    console.log(`${consolePrefix} Attempting to update document ${documentId} with data:`, updateData);

    const { data, error } = await supabase
      .from('application_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`${consolePrefix} Not Found: Document with ID ${documentId} not found.`);
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      console.error(`${consolePrefix} Supabase error updating document ${documentId}:`, error);
      throw error;
    }
    
    if (!data) {
        console.warn(`${consolePrefix} Not Found: Document with ID ${documentId} not found after update attempt (no data returned).`);
        return NextResponse.json({ error: 'Document not found or update failed' }, { status: 404 });
    }

    console.log(`${consolePrefix} Document ${documentId} updated successfully by admin ${adminUserId}.`);
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error(`${consolePrefix} General error processing document ${documentId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update document' }, { status: 500 });
  }
}