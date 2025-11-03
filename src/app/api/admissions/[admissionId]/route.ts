// C:\DevWeb\jewel-univ-apply\src\app\api\admissions\[admissionId]\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust if your authOptions path is different
import { createClient } from '@/lib/supabase/server';
import { Admission } from '@/types/admission';

export async function GET(
  request: NextRequest,
  { params }: { params: { admissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Fetch the specific admission record, ensuring it belongs to the logged-in user
    const { data: admission, error } = await supabase
      .from('admissions')
      .select(`
        id,
        admission_ref,
        admission_date,
        status,
        acceptance_deadline,
        offer_expires_at,
        created_at,
        updated_at,
        academic_session_id,
        academic_sessions (
          session_name,
          is_current
        ),
        course_id,
        courses (
          id,
          name,
          code,
          degree_type,
          faculty_id,
          faculties (
            id,
            name,
            code
          )
        ),
        user_id,
        users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', params.admissionId)
      .eq('user_id', session.user.id) // Crucially filter by user_id
      .single();

    if (error) {
        console.error(`Error fetching admission ${params.admissionId} for user ${session.user.id}:`, error.message);
         // Use status 404 if no record found, 500 for other errors
        return NextResponse.json({ error: 'Admission not found or access denied', details: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
    }
     if (!admission) {
         return NextResponse.json({ error: 'Admission not found or access denied' }, { status: 404 });
     }


    return NextResponse.json({ admission: admission as Admission });
  } catch (error: any) {
    console.error(`API Error GET /api/admissions/${params.admissionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// PUT, DELETE, etc., endpoints for the specific admission could be added here later if needed
// However, typically students might not have permissions for these, only admins.
// Admin updates would go in src/app/api/admin/admissions/[admissionId]/route.ts