// C:\DevWeb\jewel-univ-apply\src\app\api\admin\admissions\[admissionId]\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { Admission } from '@/types/admission';
import { ROLES } from '@/lib/constants';

// GET a specific admission (for admin view/edit form population)
export async function GET(
  request: NextRequest,
  { params }: { params: { admissionId: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    console.log('API GET /api/admin/admissions/[admissionId] - Token:', token ? 'Present' : 'Null');
    console.log('API GET /api/admin/admissions/[admissionId] - ROLES.ADMIN constant is:', ROLES.ADMIN);
    console.log('API GET /api/admin/admissions/[admissionId] - token?.sub:', token?.sub);
    console.log('API GET /api/admin/admissions/[admissionId] - token?.role:', token?.role);

    if (!token?.sub || token.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { admissionId } = params;
    if (!admissionId) {
      return NextResponse.json({ error: 'Admission ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: admission, error } = await supabase
      .from('admissions')
      .select(`
        id,
        user_id,
        course_id,
        academic_session_id,
        admission_ref,
        admission_date,
        status,
        offer_expires_at,
        acceptance_deadline,
        created_at,
        updated_at,
        users ( id, first_name, last_name, email ),
        courses ( id, name, code, faculty_id, faculties (id, name) ),
        academic_sessions ( id, session_name )
      `)
      .eq('id', admissionId)
      .single();

    if (error) {
      console.error(`Error fetching admission ${admissionId} for admin:`, error.message);
      return NextResponse.json({ error: 'Admission not found', details: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
    }

    if (!admission) {
        return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
    }

    return NextResponse.json({ admission: admission as Admission });

  } catch (error: any) {
    console.error(`API Error GET /api/admin/admissions/${params.admissionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// PUT to update an existing admission
export async function PUT(
  request: NextRequest,
  { params }: { params: { admissionId: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub || token.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { admissionId } = params;
    if (!admissionId) {
      return NextResponse.json({ error: 'Admission ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      status,
      admission_date,
      offer_expires_at,
      acceptance_deadline,
      course_id,
      academic_session_id,
    } = body;

    const updateData: Partial<Admission> = {};
    if (status) updateData.status = status;
    if (admission_date) updateData.admission_date = new Date(admission_date).toISOString().split('T')[0];
    if (offer_expires_at) updateData.offer_expires_at = new Date(offer_expires_at).toISOString();
    if (acceptance_deadline) updateData.acceptance_deadline = new Date(acceptance_deadline).toISOString();
    if (course_id) updateData.course_id = course_id;
    if (academic_session_id) updateData.academic_session_id = academic_session_id;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }
    updateData.updated_at = new Date().toISOString();

    const supabase = createClient();
    const { data: updatedAdmission, error } = await supabase
      .from('admissions')
      .update(updateData)
      .eq('id', admissionId)
      .select(`
        *,
        users (id, first_name, last_name, email),
        courses (id, name, code),
        academic_sessions (id, session_name)
      `)
      .single();

    if (error) {
      console.error(`Error updating admission ${admissionId}:`, error.message);
      return NextResponse.json({ error: 'Failed to update admission', details: error.message }, { status: 500 });
    }

    if (!updatedAdmission) {
        return NextResponse.json({ error: 'Admission not found for update' }, { status: 404 });
    }

    return NextResponse.json({ admission: updatedAdmission as Admission });

  } catch (error: any) {
    console.error(`API Error PUT /api/admin/admissions/${params.admissionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// DELETE an admission (use with caution)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { admissionId: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub || token.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { admissionId } = params;
    if (!admissionId) {
      return NextResponse.json({ error: 'Admission ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('admissions')
      .delete()
      .eq('id', admissionId);

    if (error) {
      console.error(`Error deleting admission ${admissionId}:`, error.message);
      return NextResponse.json({ error: 'Failed to delete admission', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Admission deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`API Error DELETE /api/admin/admissions/${params.admissionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}