// C:\DevWeb\jewel-univ-apply\src\app\api\admissions\route.ts 
import { NextRequest, NextResponse } from 'next/server'; 
import { getServerSession } from 'next-auth'; 
import { authOptions } from '@/lib/auth'; // Adjust if your authOptions path is different 
import { createClient } from '@/lib/supabase/server'; 
import { Admission } from '@/types/admission'; 

export const dynamic = 'force-dynamic';


export async function GET() {
  try { 
    const session = await getServerSession(authOptions); 
    if (!session?.user.id) { 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); 
    } 

    const supabase = createClient(); 
    const { data: admissions, error } = await supabase 
      .from('admissions') 
      .select(` 
        id, 
        admission_ref, 
        admission_date, 
        status, 
        acceptance_deadline, 
        offer_expires_at, 
        academic_session_id, 
        academic_sessions ( 
          session_name, 
          is_current 
        ), 
        course_id, 
        courses ( 
          name, 
          code, 
          degree_type, 
          faculty_id, 
          faculties ( 
            name, 
            code 
          ) 
        ) 
      `) 
      .eq('user_id', session.user.id) 
      .order('created_at', { ascending: false }); 

    if (error) { 
      console.error('Error fetching student admissions:', error.message); 
      return NextResponse.json({ error: 'Failed to fetch admissions', details: error.message }, { status: 500 }); 
    } 

    return NextResponse.json({ admissions: admissions as unknown as Admission[] });
  } catch (error: any) { 
    console.error('API Error GET /api/admissions:', error); 
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 }); 
  } 
}