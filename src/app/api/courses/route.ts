// C:\DevWeb\jewel-univ-apply\src\app\api\courses\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Course } from '@/types/admission'; // Assuming Course type is in admission.ts
// No specific session check needed for GET if these are public lookups for forms,
// but for POST/PUT/DELETE, you'd add admin role checks.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId'); // Optional filter by faculty

    let query = supabase
      .from('courses')
      .select(`
        id,
        name,
        code,
        degree_type,
        duration_years,
        faculty_id,
        faculties (
            id,
            name,
            code
        )
      `)
      .order('name', { ascending: true });

    if (facultyId) {
      query = query.eq('faculty_id', facultyId);
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('Error fetching courses:', error.message);
      return NextResponse.json({ error: 'Failed to fetch courses', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ courses: courses as unknown as Course[] });
  } catch (error: any) {
    console.error('API Error GET /api/courses:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}
