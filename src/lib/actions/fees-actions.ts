// Purpose: Fetches the list of all active fees.
"use server";
import { createClient } from '@/lib/supabase/server';

export type FeeInfo = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  is_active: boolean;
  frequency: string | null;
  fee_code: string | null;
  is_optional: boolean;
};

export async function getActiveFeeSchedule(): Promise<{ data?: FeeInfo[]; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('fees')
      .select('id, name, description, amount, is_active, frequency, fee_code, is_optional')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error("Error fetching fee schedule:", err);
    return { error: err.message };
  }
}