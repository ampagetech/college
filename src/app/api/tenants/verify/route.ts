// Verify tenant email and return tenant details (id, name, email).
// src/app/api/tenants/verify/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Tenant email is required' }, { status: 400 });
  }

  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, email') // Ensure these columns exist in your 'tenants' table
      .eq('email', email)
      .single();

    if (error) {
      console.error('Tenant verify error:', error.message);
      if (error.code === 'PGRST116') { // PostgREST error for "single() row not found"
        return NextResponse.json({ error: 'Tenant not found with this email' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to verify tenant' }, { status: 500 });
    }

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found with this email' }, { status: 404 });
    }

    // Return tenant data directly, not nested
    return NextResponse.json(tenant);

  } catch (error: any) {
    console.error('Server error in GET /api/tenants/verify:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}