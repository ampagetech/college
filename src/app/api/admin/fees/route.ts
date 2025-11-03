// src/app/api/admin/fees/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(req: NextRequest) {
  try {
    // TODO: Implement admin authentication/authorization

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabaseAdmin
      .from('fees')
      .select('*')
      .order('created_at', { ascending: false });

    // By default, only show active fees unless specifically requested
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching fees:', error);
      throw error;
    }

    return NextResponse.json(data || []);

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({
      message: error.message || 'An unexpected error occurred.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Implement admin authentication/authorization

    const body = await req.json();
    const { name, description, amount, is_active } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ message: 'Fee name is required.' }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return NextResponse.json({ message: 'Valid amount is required.' }, { status: 400 });
    }

    const feeData = {
      name: name.trim(),
      description: description?.trim() || null,
      amount: parseFloat(amount),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('fees')
      .insert([feeData])
      .select()
      .single();

    if (error) {
      console.error('Error creating fee:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ message: 'A fee with this name already exists.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({
      message: error.message || 'An unexpected error occurred.',
    }, { status: 500 });
  }
}