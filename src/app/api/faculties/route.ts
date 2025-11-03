// C:\DevWeb\jewel-univ-apply\src\app\api\faculties\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Faculty } from '@/types/admission'; // Assuming Faculty type is in admission.ts
// No specific session check needed for GET if these are public lookups for forms,
// but for POST/PUT/DELETE, you'd add admin role checks.

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: faculties, error } = await supabase
      .from('faculties')
      .select(`
        id,
        name,
        code,
        description,
        dean_name
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching faculties:', error.message);
      return NextResponse.json({ error: 'Failed to fetch faculties', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ faculties: faculties as Faculty[] });
  } catch (error: any) {
    console.error('API Error GET /api/faculties:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// POST, PUT, DELETE for faculties would go here, protected by admin role.
// For now, data is manually entered as per earlier discussion.
// Example POST structure (if you were to implement it):
/*
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // ... rest of POST logic to create a faculty
  } catch (error: any) {
    // ... error handling
  }
}
*/