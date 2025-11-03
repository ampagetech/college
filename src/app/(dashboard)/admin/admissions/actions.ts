// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admin\admissions\actions.ts
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ROLES, ADMISSION_STATUSES, ACCEPTANCE_DEADLINE_DAYS } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

//================================================
// TYPES
//================================================
export type AdmissionWithRelations = {
  id: string;
  admission_ref: string;
  admission_date: string | null;
  status: string;
  user: {
    first_name: string;
    last_name: string;
  } | null;
  course: {
    name: string;
  } | null;
  academic_session: {
    session_name:string;
  } | null;
};

export type GetAdmissionsResponse = {
  admissions: AdmissionWithRelations[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
} | {
  error: string;
};

//================================================
// ACTIONS
//================================================

// ACTION: GET ADMISSIONS
export async function getAdmissions(
  page: number = 1,
  pageSize: number = 10,
  searchTerm: string = '',
  statusFilter: string = ''
): Promise<GetAdmissionsResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== ROLES.ADMIN) {
    return { error: 'Unauthorized access.' };
  }

  const supabase = createClient();

  try {
    const offset = (page - 1) * pageSize;
    let query = supabase
      .from('admissions')
      .select(`
        id, admission_ref, admission_date, status,
        user:users ( first_name, last_name ),
        course:courses ( name ),
        academic_session:academic_sessions ( session_name )
      `, { count: 'exact' });

    if (searchTerm.trim()) {
      query = query.or(`admission_ref.ilike.%${searchTerm}%,user.first_name.ilike.%${searchTerm}%,user.last_name.ilike.%${searchTerm}%,course.name.ilike.%${searchTerm}%`);
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Get Admissions Error:', error);
      return { error: `Database Error: ${error.message}` };
    }

    // THIS IS THE FIX FOR THE TYPESCRIPT ERROR
    const fixedAdmissions: AdmissionWithRelations[] = (data || []).map((a: any) => ({
      ...a,
      user: Array.isArray(a.user) ? a.user[0] : a.user,
      course: Array.isArray(a.course) ? a.course[0] : a.course,
      academic_session: Array.isArray(a.academic_session) ? a.academic_session[0] : a.academic_session,
    }));

    return { admissions: fixedAdmissions, totalCount: count || 0, currentPage: page, totalPages: Math.ceil((count || 0) / pageSize) };
  
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { error: message };
  }
}

// ACTION: UPDATE ADMISSION STATUS
export type UpdateStatusState = { success: boolean; message: string; };
export async function updateAdmissionStatus(prevState: UpdateStatusState, formData: FormData): Promise<UpdateStatusState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== ROLES.ADMIN) {
    return { success: false, message: 'Unauthorized.' };
  }
  const admissionId = formData.get('admissionId') as string;
  const newStatus = formData.get('newStatus') as string;
  if (!admissionId || !newStatus || !Object.values(ADMISSION_STATUSES).includes(newStatus as any)) {
    return { success: false, message: 'Invalid input.' };
  }
  const supabase = createClient();
  const { error } = await supabase.from('admissions').update({ status: newStatus }).eq('id', admissionId);
  if (error) {
    return { success: false, message: `Database Error: ${error.message}` };
  }
  revalidatePath('/admin/admissions');
  return { success: true, message: 'Admission status updated successfully.' };
}

// HELPER: GENERATE ADMISSION REF
async function generateAdmissionRef(supabase: SupabaseClient): Promise<string> {
    const currentYear = new Date().getFullYear();
    let sequence = 1;
    const { data: lastAdmission } = await supabase.from('admissions').select('admission_ref').like('admission_ref', `%/${currentYear}/%`).order('created_at', { ascending: false }).limit(1).single();
    if (lastAdmission?.admission_ref) {
        const parts = lastAdmission.admission_ref.split('/');
        if (parts.length > 0) {
            const lastSequence = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }
    }
    const paddedSequence = String(sequence).padStart(3, '0');
    return `R/JUG/ADM/01/${currentYear}/${paddedSequence}`;
}

// ACTION: CREATE ADMISSION
const CreateAdmissionSchema = z.object({
  user_id: z.string().uuid({ message: 'A valid student must be selected.' }),
  course_id: z.string().uuid({ message: 'A valid course must be selected.' }),
  academic_session_id: z.string().uuid({ message: 'A valid session must be selected.' }),
});
export type CreateAdmissionState = { success: boolean; message: string; errors?: any; };
export async function createAdmission(prevState: CreateAdmissionState, formData: FormData): Promise<CreateAdmissionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== ROLES.ADMIN) {
    return { success: false, message: 'Unauthorized.' };
  }
  const validatedFields = CreateAdmissionSchema.safeParse({
    user_id: formData.get('user_id'),
    course_id: formData.get('course_id'),
    academic_session_id: formData.get('academic_session_id'),
  });
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid input.', errors: validatedFields.error.flatten().fieldErrors, };
  }
  const supabase = createClient();
  try {
    const { user_id, course_id, academic_session_id } = validatedFields.data;
    const admission_ref = await generateAdmissionRef(supabase);
    const admission_date = new Date();
    const acceptance_deadline = new Date(admission_date);
    acceptance_deadline.setDate(admission_date.getDate() + ACCEPTANCE_DEADLINE_DAYS);
    const { error } = await supabase.from('admissions').insert({
      user_id, course_id, academic_session_id, admission_ref,
      admission_date: admission_date.toISOString().split('T')[0],
      status: ADMISSION_STATUSES.PROVISIONAL,
      acceptance_deadline: acceptance_deadline.toISOString(),
    });
    if (error) {
      if (error.code === '23505') { return { success: false, message: 'This student already has an admission record.' }; }
      return { success: false, message: `Database Error: ${error.message}` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, message };
  }
  revalidatePath('/admin/admissions');
  redirect('/admin/admissions');
}

// ACTION: DELETE ADMISSION
export type DeleteState = { success: boolean; message: string; };
export async function deleteAdmission(prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== ROLES.ADMIN) {
    return { success: false, message: 'Unauthorized.' };
  }
  const admissionId = formData.get('admissionId') as string;
  if (!admissionId) {
    return { success: false, message: 'Admission ID is missing.' };
  }
  const supabase = createClient();
  const { error } = await supabase.from('admissions').delete().eq('id', admissionId);
  if (error) {
    return { success: false, message: `Database Error: ${error.message}` };
  }
  revalidatePath('/admin/admissions');
  return { success: true, message: 'Admission record deleted successfully.' };
}

//================================================
// HTML ADMISSION LETTER GENERATION
//================================================

// ACTION: GET ADMISSION DETAILS FOR HTML LETTER
export async function getAdmissionDetails(admissionId: string): Promise<{
  success: boolean;
  message?: string;
  admission?: any;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== ROLES.ADMIN) {
    return { success: false, message: 'Unauthorized.' };
  }

  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('admissions')
      .select(`
        *,
        user:users (*),
        course:courses (*),
        academic_session:academic_sessions (*)
      `)
      .eq('id', admissionId)
      .single();

    if (error) {
      return { success: false, message: `Database Error: ${error.message}` };
    }

    if (!data) {
      return { success: false, message: 'Admission not found.' };
    }

    return { success: true, admission: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, message };
  }
}