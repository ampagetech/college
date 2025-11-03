// src/app/(dashboard)/tenants89asdf11/actions.ts
'use server';

// Import BOTH client helpers
import {
  createServerActionClient,
  createServerComponentClient, // <-- ADD THIS IMPORT
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { tenantSchema, TenantFormData } from  '@/types/tenant';
import type { Database } from '@/types/supabase';

// Action to GET all tenants
// This is called from a Server Component, so it must use the Component client
export async function getTenants() {
  const cookieStore = cookies();
  // Use the 'Component' client which is read-only for cookies
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore }); // <-- CHANGED

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      // Throw the error to be caught by the page component
      throw new Error(error.message, { cause: error });
    }
    return { success: true, data };
  } catch (error: any) {
    console.error("Error in getTenants:", error);
    return { success: false, error: error.message };
  }
}

// Action to CREATE or UPDATE a tenant
// This is a true Server Action called from the client, so it uses the Action client
export async function saveTenant(formData: TenantFormData) {
  const cookieStore = cookies();
  // Use the 'Action' client which CAN write cookies
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore }); // <-- THIS STAYS THE SAME

  // ... rest of the saveTenant function remains unchanged ...
  const validatedFields = tenantSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid data provided.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, ...tenantData } = validatedFields.data;

  // Convert Date objects to ISO strings for Supabase
  const supabaseCompatibleData = {
    ...tenantData,
    subscription_start: tenantData.subscription_start?.toISOString() || null,
    subscription_end: tenantData.subscription_end?.toISOString() || null,
  };

  try {
    let savedData;
    if (id) {
      // --- UPDATE logic ---
      const { data, error } = await supabase
        .from('tenants')
        .update(supabaseCompatibleData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      savedData = data;
    } else {
      // --- CREATE logic ---
      const { data, error } = await supabase
        .from('tenants')
        .insert(supabaseCompatibleData)
        .select()
        .single();
      if (error) throw error;
      savedData = data;
    }

    revalidatePath('/tenants89asdf11'); // Ensure this path is correct
    return { success: true, data: savedData };

  } catch (error: any) {
    if (error.code === '23505') {
      return { success: false, error: 'A tenant with this email already exists.' };
    }
    return { success: false, error: error.message };
  }
}