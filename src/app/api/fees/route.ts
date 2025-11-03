// C:\DevWeb\jewel-univ-apply\src\app\api\fees\route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';



// Corrected interface (no category_id or course_id)
interface ApiFeeResponse {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  is_active: boolean;
  frequency?: string | null;
  fee_code?: string | null;
  is_optional?: boolean | null;
}

export async function GET() {
  const supabase = createClient();

  try {
    // Corrected select query (no category_id or course_id)
    const { data, error } = await supabase
      .from('fees')
      .select(`
        id, 
        name, 
        description, 
        amount, 
        is_active,
        frequency,
        fee_code,
        is_optional
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      // Keep this essential error log for production
      console.error('[API/fees] Supabase error fetching fees:', error); 
      throw new Error('Database query failed while fetching fees.'); 
    }
    
    if (!data) {
      return NextResponse.json([], { status: 200 });
    }

    // Corrected data transformation (no category_id or course_id)
    const transformedData: ApiFeeResponse[] = data.map((fee: any) => {
      return {
        id: String(fee.id),
        name: String(fee.name),
        description: fee.description ? String(fee.description) : null,
        amount: Number(fee.amount),
        is_active: Boolean(fee.is_active),
        frequency: fee.frequency || null,
        fee_code: fee.fee_code || null,
        is_optional: fee.is_optional || false,
      };
    });
    
    return NextResponse.json(transformedData, { status: 200 });

  } catch (error: any) { 
    // Keep this essential error log for production
    console.error('[API/fees] General error in GET handler:', error.message);
    return NextResponse.json({ 
        error: 'Failed to fetch fees due to an unexpected server error.',
    }, { status: 500 });
  }
}