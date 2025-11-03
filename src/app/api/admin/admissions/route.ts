// C:\DevWeb\jewel-univ-apply\src\app\api\admin\admissions\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust if your authOptions path is different

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Admission } from '@/types/admission';
import { ACCEPTANCE_DEADLINE_DAYS, OFFER_EXPIRY_DAYS, ROLES } from '@/lib/constants';

// Helper function to generate a unique admission reference
async function generateAdmissionRef(supabase: SupabaseClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  let sequence = 1; // Default starting sequence for the year
  let uniqueRefFound = false;
  let admissionRef = '';

  // Try to get the last sequence number for the current year to increment
  const { data: lastAdmissionForYear, error: lastRefError } = await supabase
    .from('admissions')
    .select('admission_ref')
    .like('admission_ref', `%/${currentYear}/%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastAdmissionForYear && lastAdmissionForYear.admission_ref) {
    const parts = lastAdmissionForYear.admission_ref.split('/');
    const lastSequence = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  let attempt = 0;
  while (!uniqueRefFound && attempt < 10) { // Limit attempts to avoid infinite loops
    const paddedSequence = String(sequence + attempt).padStart(3, '0');
    admissionRef = `R/JUG/ADM/01/${currentYear}/${paddedSequence}`;

    const { data: existing, error: checkError } = await supabase
      .from('admissions')
      .select('id')
      .eq('admission_ref', admissionRef)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for existing admission ref:", checkError);
      throw new Error("Failed to verify admission reference uniqueness.");
    }
    if (!existing) {
      uniqueRefFound = true;
    } else {
      attempt++; // Increment sequence and try again if ref already exists
    }
  }

  if (!uniqueRefFound) {
    // Fallback or more robust generation needed if 10 attempts fail
    console.warn("Could not generate a unique admission reference after 10 attempts. Using timestamp fallback.");
    admissionRef = `R/JUG/ADM/01/${currentYear}/TS${Date.now().toString().slice(-5)}`;
  }
  return admissionRef;
}


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id || session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');
    const sessionId = searchParams.get('sessionId');
    const searchTerm = searchParams.get('searchTerm'); // For student name or ref

    const offset = (page - 1) * limit;

    let query = supabase
      .from('admissions')
      .select(`
        id,
        admission_ref,
        admission_date,
        status,
        users!inner ( id, first_name, last_name, email ),
        courses!inner ( id, name, code, faculties!inner(id, name) ),
        academic_sessions!inner ( id, session_name )
      `, { count: 'exact' }) // Get total count for pagination
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (courseId) query = query.eq('course_id', courseId);
    if (sessionId) query = query.eq('academic_session_id', sessionId);
    if (searchTerm) {
      // This is a bit tricky. Supabase doesn't directly support OR on joined table text search easily without views/rpc.
      // A simpler approach for now might be to search by admission_ref or filter client-side after fetching more.
      // Or, implement an RPC function in Supabase.
      // For now, searching by admission_ref:
      query = query.ilike('admission_ref', `%${searchTerm}%`);
      // If you need to search by user name, you might need a more complex query or an RPC.
      // Example for searching user's name (might need adjustments or an RPC for efficiency):
      // query = query.or(`users.first_name.ilike.%${searchTerm}%,users.last_name.ilike.%${searchTerm}%`);
    }


    const { data: admissions, error, count } = await query;

    if (error) {
      console.error('Error fetching admissions for admin:', error.message);
      return NextResponse.json({ error: 'Failed to fetch admissions', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      admissions: admissions as unknown as Admission[],
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
    });

  } catch (error: any) {
    console.error('API Error GET /api/admin/admissions:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id || session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      user_id,
      course_id,
      academic_session_id,
      admission_date: customAdmissionDate, // Optional: admin can set a specific admission date
      status: customStatus // Optional: admin can set an initial status
    } = body;

    if (!user_id || !course_id || !academic_session_id) {
      return NextResponse.json({ error: 'User ID, Course ID, and Academic Session ID are required' }, { status: 400 });
    }

    const supabase = createClient();
    const admissionRef = await generateAdmissionRef(supabase);
    
    const baseAdmissionDate = customAdmissionDate ? new Date(customAdmissionDate) : new Date();
    
    const acceptanceDeadline = new Date(baseAdmissionDate);
    acceptanceDeadline.setDate(baseAdmissionDate.getDate() + ACCEPTANCE_DEADLINE_DAYS);

    const offerExpiresAt = new Date(baseAdmissionDate);
    offerExpiresAt.setDate(baseAdmissionDate.getDate() + OFFER_EXPIRY_DAYS);

    const newAdmissionData: Partial<Admission> & { user_id: string; course_id: string; academic_session_id: string } = {
      user_id,
      course_id,
      academic_session_id,
      admission_ref: admissionRef,
      admission_date: baseAdmissionDate.toISOString().split('T')[0], // Store as YYYY-MM-DD
      status: customStatus || 'provisional',
      acceptance_deadline: acceptanceDeadline.toISOString(),
      offer_expires_at: offerExpiresAt.toISOString(),
    };

    const { data: newAdmission, error } = await supabase
      .from('admissions')
      .insert(newAdmissionData)
      .select(`
        *,
        users (id, first_name, last_name, email),
        courses (id, name, code),
        academic_sessions (id, session_name)
      `)
      .single();

    if (error) {
      console.error('Error creating admission:', error.message);
      if (error.code === '23505') { // Unique constraint violation (e.g. admission_ref if somehow not unique)
        return NextResponse.json({ error: 'Failed to create admission due to a conflict. Please try again.', details: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create admission', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ admission: newAdmission as Admission }, { status: 201 });

  } catch (error: any) {
    console.error('API Error POST /api/admin/admissions:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}