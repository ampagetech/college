// src/lib/actions/tenant-actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface TenantInfo {
  name: string;
}

// This action fetches the name of a tenant based on the logged-in user's tenant_id.
export async function getTenantInfo(): Promise<{ data: TenantInfo | null; error: string | null; }> {
  try {
    // 1. Security: Get the server-side session to identify the user.
    const session = await getServerSession(authOptions);
    
    console.log('getTenantInfo - Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      tenantId: session?.user?.tenant_id
    });
    
    if (!session?.user?.id) {
      return { data: null, error: 'User is not authenticated.' };
    }
    
    // 2. Check if the user has a tenant_id assigned.
    const tenantId = session.user.tenant_id;
    if (!tenantId) {
      console.log('getTenantInfo - No tenant_id found for user:', session.user.id);
      // This is not an error, it's a valid state. The user simply doesn't belong to a tenant.
      return { data: null, error: null };
    }

    console.log('getTenantInfo - Fetching tenant info for ID:', tenantId);

    // 3. Create a Supabase client that can run in Server Actions.
    const supabase = createServerActionClient({ cookies });
    
    // 4. Fetch the tenant's name from your 'tenants' table.
    const { data, error } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Supabase error fetching tenant info:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        return { data: null, error: `No tenant found with ID: ${tenantId}` };
      }
      
      throw new Error(`Failed to fetch tenant information: ${error.message}`);
    }

    console.log('getTenantInfo - Successfully fetched tenant data:', data);

    // 5. Return the fetched data in a structured format.
    return { data, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching tenant data.';
    console.error('getTenantInfo - Error:', errorMessage);
    return { data: null, error: errorMessage };
  }
}