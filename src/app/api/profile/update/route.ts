import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = await request.json();
    
    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        class: updateData.class,
        tenant_id: updateData.tenant_id
      })
      .eq('email', session.user.email);

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}