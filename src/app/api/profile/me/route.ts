//  Fetch current authenticated user's full profile (user + tenant details).
// src/app/api/profile/me/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
// Assuming authOptions is exported from the [...nextauth] route file or lib/auth.ts
// You had: import { authOptions } from '../../auth/[...nextauth]/route';
// Let's try to make it more standard if it's in lib/auth.ts
// If your authOptions is indeed in 'app/api/auth/[...nextauth]/route.ts', adjust the import.
// For now, assuming you have an authOptions export somewhere standard like lib/auth
import { authOptions } from '@/lib/auth'; // You'll need to create/ensure this file exists and exports authOptions
                                       // If not, revert to: import { authOptions } from '../../auth/[...nextauth]/route';
                                       // Or wherever your authOptions are defined. The user provided nextauth route directly, so it's likely inside that file.
                                       // For now, let's use the one from [...nextauth] to match previous pattern.
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // This might cause circular dependency if authOptions is in the same file.
// It's better if authOptions is in a separate lib file.
// For now, I will assume it's correctly imported from where your `authOptions` are defined.

// Let's assume your authOptions are in `lib/auth.ts` as per your folder structure and `app/api/auth/[...nextauth]/route.ts`
// If not, adjust the import path for authOptions.

export async function GET() {
  try {
    const session = await getServerSession(authOptions); // Ensure authOptions is correctly imported
    if (!session?.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        first_name,
        last_name,
        class,
        tenant_id,
        email
      `)
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Fetch user error:', userError.message);
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (!userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let tenantName: string | null = null;
    let tenantEmail: string | null = null;

    if (userData.tenant_id) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('name, email')
        .eq('id', userData.tenant_id)
        .single();

      if (tenantError) {
        console.warn(`Failed to fetch tenant details for tenant_id ${userData.tenant_id}:`, tenantError.message);
        // Don't fail the request, just means tenant info won't be there
      } else if (tenant) {
        tenantName = tenant.name;
        tenantEmail = tenant.email;
      }
    }

    const profileResponse = {
      firstName: userData.first_name,
      lastName: userData.last_name,
      classValue: userData.class, // Map 'class' from DB to 'classValue'
      userEmail: userData.email, // User's own email
      tenantId: userData.tenant_id,
      associatedTenantName: tenantName,
      associatedTenantEmail: tenantEmail,
    };

    return NextResponse.json(profileResponse);

  } catch (error: any) {
    console.error('Server error in GET /api/profile/me:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}