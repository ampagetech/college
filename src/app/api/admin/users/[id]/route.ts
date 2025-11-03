// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';

// Cache prevention
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface UpdateUserPayload {
  role?: string;
  status?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const consolePrefix = '[API PUT /api/admin/users/[id]]';
  const { id: userId } = params;
  console.log(`${consolePrefix} Request received for user ID: ${userId}`);

  // Set no-cache headers
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    console.error(`${consolePrefix} Unauthorized: No token or subject.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  // Ensure user is an admin
  // Assuming ROLES.ADMIN is already lowercase, e.g., 'admin'
  if (String(token.role).toLowerCase() !== ROLES.ADMIN.toLowerCase()) {
    console.warn(`${consolePrefix} Forbidden: User ${token.sub} with role ${token.role} is not an admin.`);
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403, headers });
  }

  const adminUserId = token.sub;
  console.log(`${consolePrefix} Admin user ${adminUserId} authenticated.`);

  if (!userId) {
    console.warn(`${consolePrefix} Bad Request: User ID is required.`);
    return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers });
  }

  let payload: UpdateUserPayload;
  try {
    payload = await request.json();
    console.log(`${consolePrefix} Parsed payload for user ${userId}:`, payload);
  } catch (e) {
    console.error(`${consolePrefix} Bad Request: Invalid JSON payload.`, e);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers });
  }

  const { role, status } = payload;

  // Ensure validRoles are all lowercase (matches enum and frontend)
  const validRoles = ['admin', 'teacher', 'student', 'applicant']; 
  
  // Ensure validStatuses are all lowercase (matches enum and frontend)
  const validStatuses = ['pending', 'approved', 'inactive', 'suspended', 'terminated'];

  // Validate role (frontend should send lowercase)
  if (role && !validRoles.includes(role)) { // role should already be lowercase
    console.warn(`${consolePrefix} Bad Request: Invalid role value '${role}' for user ${userId}. Valid roles: ${validRoles.join(', ')}`);
    return NextResponse.json({ error: `Invalid role value. Valid roles: ${validRoles.join(', ')}` }, { status: 400, headers });
  }

  // Validate status (frontend should send lowercase)
  if (status && !validStatuses.includes(status)) { // status should already be lowercase
    console.warn(`${consolePrefix} Bad Request: Invalid status value '${status}' for user ${userId}. Valid statuses: ${validStatuses.join(', ')}`);
    return NextResponse.json({ error: `Invalid status value. Valid statuses: ${validStatuses.join(', ')}` }, { status: 400, headers });
  }

  const supabase = createClient();

  try {
    // Build update data object - only include fields that are provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Store values as they come from frontend (expected to be lowercase for both)
    if (role !== undefined) updateData.role = role; 
    if (status !== undefined) updateData.status = status;

    console.log(`${consolePrefix} Attempting to update user ${userId} with data:`, updateData);

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select() // Select the updated row to return it
      .single(); // Expect a single row to be updated and returned

    if (error) {
      if (error.code === 'PGRST116') { // Error when no row is found
        console.warn(`${consolePrefix} Not Found: User with ID ${userId} not found.`);
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers });
      }
      if (error.code === '23505') { // Unique constraint violation (likely email)
        console.warn(`${consolePrefix} Conflict: Unique constraint violation for user ${userId}.`);
        // The error message from Supabase for 23505 might be more specific, e.g., about email.
        // You might want to parse error.message if it contains useful info like "duplicate key value violates unique constraint <constraint_name>"
        return NextResponse.json({ error: 'A user with this information already exists or conflicts with existing data.' }, { status: 409, headers });
      }
      // Check for enum validation error (example, actual code might vary)
      if (error.message.includes('invalid input value for enum')) {
        console.warn(`${consolePrefix} Bad Request: Enum validation failed for user ${userId}. Error: ${error.message}`);
        return NextResponse.json({ error: `Invalid value for role or status. ${error.message}` }, { status: 400, headers });
      }
      console.error(`${consolePrefix} Supabase error updating user ${userId}:`, error);
      throw error; // Rethrow to be caught by the general catch block
    }
    
    if (!data) { // Should be caught by PGRST116, but as a fallback
      console.warn(`${consolePrefix} Not Found: User with ID ${userId} not found after update attempt (no data returned).`);
      return NextResponse.json({ error: 'User not found or update failed' }, { status: 404, headers });
    }

    console.log(`${consolePrefix} User ${userId} updated successfully by admin ${adminUserId}.`);
    
    // Add timestamp to response for cache busting
    const response = {
      ...data,
      _timestamp: Date.now()
    };

    return NextResponse.json(response, { status: 200, headers });

  } catch (error: any) {
    console.error(`${consolePrefix} General error processing user ${userId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500, headers });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // PATCH can use the same logic as PUT for partial updates
  return PUT(request, { params });
}