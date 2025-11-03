// C:\DevWeb\jewel-univ-apply\src\app\api\academic-sessions\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const onlyCurrent = searchParams.get('current') === 'true';

    let query = supabase
      .from('academic_sessions')
      .select(`
        id,
        session_name,
        start_date,
        end_date,
        is_current,
        registration_start_date,
        registration_end_date
      `)
      .order('start_date', { ascending: false });

    if (onlyCurrent) {
      query = query.eq('is_current', true);
    }

    const { data: academicSessions, error } = await query;

    if (error) {
      console.error('Error fetching academic sessions:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch academic sessions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ academicSessions });
  } catch (error: any) {
    console.error('API Error GET /api/academic-sessions:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}