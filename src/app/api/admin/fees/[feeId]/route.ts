// src/app/api/admin/fees/[feeId]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function PUT(req: NextRequest, { params }: { params: { feeId: string } }) {
  try {
    // TODO: Implement admin authentication/authorization

    const { feeId } = params;
    const body = await req.json();
    const { name, description, amount, is_active } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ message: 'Fee name is required.' }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return NextResponse.json({ message: 'Valid amount is required.' }, { status: 400 });
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      amount: parseFloat(amount),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('fees')
      .update(updateData)
      .eq('id', feeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating fee:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ message: 'A fee with this name already exists.' }, { status: 409 });
      }
      if (error.code === 'PGRST116') { // No rows updated
        return NextResponse.json({ message: 'Fee not found.' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({
      message: error.message || 'An unexpected error occurred.',
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { feeId: string } }) {
  try {
    // TODO: Implement admin authentication/authorization

    const { feeId } = params;

    const { error } = await supabaseAdmin
      .from('fees')
      .delete()
      .eq('id', feeId);

    if (error) {
      console.error('Error deleting fee:', error);
      if (error.code === 'PGRST116') { // No rows deleted
        return NextResponse.json({ message: 'Fee not found.' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Fee deleted successfully.' });

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({
      message: error.message || 'An unexpected error occurred.',
    }, { status: 500 });
  }
}