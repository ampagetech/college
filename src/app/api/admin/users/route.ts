// File: src/app/api/admin/simple-users/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/user'; // <<<< USE EXISTING User TYPE

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const roleFilter = searchParams.get('role');
  const searchFilter = searchParams.get('search');

  console.log('API (simple-users): Received params:', { page, limit, roleFilter, searchFilter });

  try {
    let query = supabase
      .from('users')
      .select( // Select only the fields needed for the simple display + ID
        `
        id,
        first_name,
        last_name,
        email,
        role 
      `, // status, class, tenant_id etc. are NOT selected
        { count: 'exact' }
      );

    if (roleFilter && roleFilter.trim() !== '') {
      query = query.eq('role', roleFilter);
    }

    if (searchFilter && searchFilter.trim() !== '') {
      query = query.or(
        `first_name.ilike.%${searchFilter}%,last_name.ilike.%${searchFilter}%,email.ilike.%${searchFilter}%`
      );
    }

    query = query.order('last_name', { ascending: true }).order('first_name', { ascending: true });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;
    query = query.range(startIndex, endIndex);

    const { data: dbUsers, count, error } = await query;

    if (error) {
      console.error('Supabase query error (simple-users):', error);
      throw error;
    }

    // Map to the User type, populating only the fetched fields.
    // Other fields from the User interface will be undefined or their default if not optional.
    const users: User[] =
      dbUsers.map((dbUser) => ({
        id: dbUser.id,
        first_name: dbUser.first_name || '',
        last_name: dbUser.last_name || '',
        email: dbUser.email,
        role: dbUser.role, // This is the enum value (string)
        name: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),

        // Fields from the full User interface that are NOT fetched will be missing
        // or you can explicitly set them to undefined/null if your User type allows.
        // Ensure these match how User type defines them (optional '?' or ' | null | undefined')
        application_id: undefined,
        status: '', // Or undefined, if User type allows. '' might be problematic for StatusBadge
        class: '',  // Or undefined, if User type allows.
        tenant_id: null,
        tenant_name: undefined,
        created_at: undefined, // Not fetched
        updated_at: undefined, // Not fetched
        approved_by: null,
        approved_at: null,
        admin_comment_docs_biodata: null,
      })) || [];

    const responsePayload = {
      users: users,
      page: page,
      totalPages: Math.ceil((count || 0) / limit),
      total: count || 0,
    };

    console.log(`API (simple-users): Returning ${users.length} users. Total matching: ${count}`);
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('API Error (simple-users):', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch simple user list',
        details: error instanceof Error ? error.message : String(error),
        users: [],
        page: 1,
        totalPages: 0,
        total: 0,
      },
      { status: 500 }
    );
  }
}