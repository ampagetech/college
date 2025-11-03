// src/app/(dashboard)/admin/fees/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// --- INTERFACES ---

export interface Fee {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  is_active: boolean;
  frequency: 'per_semester' | 'once_on_registration' | 'annual';
  is_optional: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeActionState {
  success: boolean
  message: string
}

interface CreateFeeData {
  name: string
  description: string | null
  amount: number
  is_active: boolean
  frequency: 'per_semester' | 'once_on_registration' | 'annual'
  is_optional: boolean
}

type UpdateFeePayload = Omit<CreateFeeData, 'id'>


// --- NEW READ ACTION ---

export async function getFees(options: { includeInactive: boolean }): Promise<{ data: Fee[] | null, error: string | null }> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('fees')
      .select('*')
      .order('name', { ascending: true });

    if (!options.includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase getFees error:", error);
      throw new Error(error.message);
    }

    return { data: data as Fee[], error: null };

  } catch (err) {
    console.error("Unexpected getFees error:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred while fetching fees.";
    return { data: null, error: message };
  }
}


// --- CUD ACTIONS (UNCHANGED, BUT INCLUDED FOR COMPLETENESS) ---

export async function createFee(formData: FormData): Promise<FeeActionState> {
  // ... (existing createFee function is correct)
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const is_active = formData.get('is_active') === 'true'
    const frequency = formData.get('frequency') as 'per_semester' | 'once_on_registration' | 'annual'
    const is_optional = formData.get('is_optional') === 'true'

    if (!name?.trim()) return { success: false, message: 'Fee name is required' }
    if (!frequency) return { success: false, message: 'Frequency is required' }
    if (isNaN(amount) || amount < 0) return { success: false, message: 'A valid, non-negative amount is required' }
    const allowedFrequencies = ['per_semester', 'once_on_registration', 'annual']
    if (!allowedFrequencies.includes(frequency)) return { success: false, message: 'Invalid frequency value' }

    const data: CreateFeeData = {
      name: name.trim(),
      description: description?.trim() || null,
      amount,
      is_active,
      frequency,
      is_optional
    }

    const supabase = createClient()
    const { error } = await supabase.from('fees').insert(data)

    if (error) {
      console.error('Supabase error creating fee:', error)
      return { success: false, message: `Failed to create fee: ${error.message}` }
    }

    revalidatePath('/admin/fees')
    return { success: true, message: 'Fee created successfully!' }

  } catch (err) {
    console.error('Unexpected error creating fee:', err)
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'An unexpected error occurred.' 
    }
  }
}

export async function updateFee(formData: FormData): Promise<FeeActionState> {
  // ... (existing updateFee function is correct)
  try {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const is_active = formData.get('is_active') === 'true'
    const frequency = formData.get('frequency') as 'per_semester' | 'once_on_registration' | 'annual'
    const is_optional = formData.get('is_optional') === 'true'

    if (!id) return { success: false, message: 'Fee ID is required for update' }
    if (!name?.trim()) return { success: false, message: 'Fee name is required' }
    if (!frequency) return { success: false, message: 'Frequency is required' }
    if (isNaN(amount) || amount < 0) return { success: false, message: 'A valid, non-negative amount is required' }
    const allowedFrequencies = ['per_semester', 'once_on_registration', 'annual']
    if (!allowedFrequencies.includes(frequency)) return { success: false, message: 'Invalid frequency value' }

    const updateData: UpdateFeePayload = {
      name: name.trim(),
      description: description?.trim() || null,
      amount,
      is_active,
      frequency,
      is_optional
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('fees')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Supabase error updating fee:', error)
      return { success: false, message: `Failed to update fee: ${error.message}` }
    }

    revalidatePath('/admin/fees')
    return { success: true, message: 'Fee updated successfully!' }

  } catch (err) {
    console.error('Unexpected error updating fee:', err)
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'An unexpected error occurred.' 
    }
  }
}

export async function deleteFee(id: string): Promise<FeeActionState> {
  // ... (existing deleteFee function is correct)
  try {
    if (!id) return { success: false, message: 'Fee ID is required for deletion' }
    
    const supabase = createClient()
    const { error } = await supabase.from('fees').delete().eq('id', id)

    if (error) {
      console.error('Supabase error deleting fee:', error)
      return { success: false, message: `Failed to delete fee: ${error.message}` }
    }

    revalidatePath('/admin/fees')
    return { success: true, message: 'Fee deleted successfully!' }

  } catch (err) {
    console.error('Unexpected error deleting fee:', err)
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'An unexpected error occurred.' 
    }
  }
}