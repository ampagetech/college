// Purpose: Fetches the current academic session details.
"use server";
import { createClient } from '@/lib/supabase/server';

export type CurrentSessionInfo = {
  session_name: string;
  start_date: string;
  end_date: string;
};

export async function getCurrentAcademicSession(): Promise<{ data?: CurrentSessionInfo | null; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('academic_sessions')
      .select('session_name, start_date, end_date')
      .eq('is_current', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { error: 'No active academic session is set.' };
      throw error;
    }
    return { data };
  } catch (err: any) {
    console.error("Error fetching current academic session:", err);
    return { error: err.message };
  }
}