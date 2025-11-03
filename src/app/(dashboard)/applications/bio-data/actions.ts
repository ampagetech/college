// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\applications\bio-data\actions.ts

'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PATHS } from '@/lib/constants';

// Registration Fee ID constant
const APPLICATION_FEE_ID = '21fcb521-2271-49a1-9466-afa3db301410';

// Data types for fetching from DB
export interface Faculty {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  name: string;
  faculty_id: string;
}

// Payment verification types
export type PaymentVerificationResult = {
  hasPaid: boolean;
  paymentId?: string | null;
  error?: string | null;
};

export type State = {
  success: boolean;
  message: string | null;
  errors?: Record<string, string[]> | null;
};

// --- UPDATED ZOD SCHEMA WITH NEW COURSE ID FIELDS AND VALIDATION ---
const BioDataSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  // Personal Info
  surname: z.string().min(2, "Surname is required."),
  firstName: z.string().min(2, "First name is required."),
  middleName: z.string().optional().nullable(),
  gender: z.string().min(1, "Gender is required."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  maritalStatus: z.string().min(1, "Marital status is required."),
  stateOfOrigin: z.string().min(1, "State of Origin is required."),
  lga: z.string().min(1, "LGA is required."),
  religion: z.string().min(1, "Religion is required."),
  address: z.string().min(10, "Address must be at least 10 characters."),
  phoneNumber: z.string().min(10, "Phone number is required."),
  disability: z.string().optional().nullable(),
  healthChallenge: z.string().optional().nullable(),
  
  // Guardian Info
  guardianName: z.string().min(2, "Guardian's name is required."),
  guardianAddress: z.string().min(10, "Guardian's address is required."),
  guardianOccupation: z.string().min(2, "Guardian's occupation is required."),
  guardianRelationship: z.string().min(1, "Relationship is required."),
  guardianPhoneNumber: z.string().min(10, "Guardian's phone is required."),
  
  // Education Info
  schoolName: z.string().min(3, "Last school is required."),
  yearOfEntry: z.coerce.number().min(1900, "Year of entry is required."),
  yearOfGraduation: z.coerce.number().min(1900, "Year of graduation is required."),
  qualificationObtained: z.string().min(1, "Qualification is required."),
  
  // Optional second school
  schoolName2: z.string().optional().nullable(),
  yearOfEntry2: z.coerce.number().optional().nullable(),
  yearOfGraduation2: z.coerce.number().optional().nullable(),
  qualificationObtained2: z.string().optional().nullable(),

  // Optional third school
  schoolName3: z.string().optional().nullable(),
  yearOfEntry3: z.coerce.number().optional().nullable(),
  yearOfGraduation3: z.coerce.number().optional().nullable(),
  qualificationObtained3: z.string().optional().nullable(),
  
  // --- UPDATED: Program Choice ---
  jambRegistrationNumber: z.string()
    .min(8, "JAMB number must be at least 8 characters.")
    .max(14, "JAMB number must not exceed 14 characters."),
  firstChoiceCourseId: z.string().uuid("Please select a valid first choice course."),
  secondChoiceCourseId: z.string().uuid("Please select a valid second choice course."),
  // The faculty IDs are for frontend state management and not part of this schema
})
.refine(data => data.yearOfGraduation >= data.yearOfEntry, {
  message: "Graduation year must be after or same as entry year.",
  path: ["yearOfGraduation"],
})
.refine(data => {
  if (data.yearOfEntry2 && data.yearOfGraduation2) {
    return data.yearOfGraduation2 >= data.yearOfEntry2;
  }
  return true;
}, {
  message: "Graduation year must be after or same as entry year.",
  path: ["yearOfGraduation2"],
})
.refine(data => {
  if (data.yearOfEntry3 && data.yearOfGraduation3) {
    return data.yearOfGraduation3 >= data.yearOfEntry3;
  }
  return true;
}, {
  message: "Graduation year must be after or same as entry year.",
  path: ["yearOfGraduation3"],
})
.refine(data => data.firstChoiceCourseId !== data.secondChoiceCourseId, {
  message: "Second choice cannot be the same as the first choice.",
  path: ["secondChoiceCourseId"],
});


/**
 * Fetches all faculties from the database.
 */
export async function getFaculties(): Promise<Faculty[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('faculties').select('id, name').order('name');
    if (error) {
        console.error("Error fetching faculties:", error);
        return [];
    }
    return data;
}

/**
 * Fetches all courses from the database.
 */
export async function getCourses(): Promise<Course[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('courses').select('id, name, faculty_id').order('name');
    if (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
    return data;
}

/**
 * Checks if the user has paid the Application fee.
 * A payment is considered successful if its status is 'confirmed'.
 */
export async function checkApplicationFeePaid(userId?: string): Promise<PaymentVerificationResult> {
  try {
    let userIdToCheck = userId;
    if (!userIdToCheck) {
      const session = await getServerSession(authOptions);
      if (!session?.user.id) {
        return { hasPaid: false, error: 'User not authenticated' };
      }
      userIdToCheck = session.user.id;
    }

    const supabase = createClient();
    
    const { data: confirmedPayment, error: queryError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userIdToCheck)
      .eq('fee_id', APPLICATION_FEE_ID)
      .eq('status', 'confirmed')
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error('Payment query error:', queryError);
      return { hasPaid: false, error: 'DATABASE_ERROR' };
    }

    const hasPaid = !!confirmedPayment;

    return {
      hasPaid: hasPaid,
      paymentId: confirmedPayment ? (confirmedPayment.id as string) : null,
      error: null,
    };

  } catch (error) {
    console.error('Error in checkApplicationFeePaid:', error);
    return { hasPaid: false, error: 'SYSTEM_ERROR' };
  }
}

/**
 * Gets current user's payment status (convenience function)
 */
export async function getCurrentUserPaymentStatus(): Promise<PaymentVerificationResult> {
  return await checkApplicationFeePaid();
}


const toSnakeCase = (str: string) => str.replace(/[A-Z0-9]/g, letter => `_${letter.toLowerCase()}`);

export async function upsertBioData(prevState: State, formData: FormData): Promise<State> {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return { success: false, message: 'Authentication failed. Please sign in again.' };
  }

  const paymentStatus = await checkApplicationFeePaid(session.user.id);
  if (!paymentStatus.hasPaid) {
    return { 
      success: false, 
      message: 'Application Fee Payment Required Before Filling BioData. Please Complete your Payment first.' 
    };
  }

  const jsonString = formData.get('jsonData') as string;
  if (!jsonString) {
    return { success: false, message: 'Form data is missing. Please try again.' };
  }
  const formValues: unknown = JSON.parse(jsonString);

  const validatedFields = BioDataSchema.safeParse(formValues);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Invalid form data. Please check all fields.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // Updated logic to handle course IDs properly
  const dataToUpsert = Object.entries(validatedFields.data).reduce<Record<string, any>>((acc, [key, value]) => {
    if (key !== 'id') {
      // For course IDs, convert empty strings to null
      if (key === 'firstChoiceCourseId' || key === 'secondChoiceCourseId') {
        acc[toSnakeCase(key)] = value === '' ? null : value;
      } 
      // For other fields, only include if not null and not empty string
      else if (value != null && value !== '') {
        acc[toSnakeCase(key)] = value;
      }
    }
    return acc;
  }, {});

  dataToUpsert.user_id = session.user.id;

  const supabase = createClient();
  const { error } = await supabase
    .from('applications')
    .upsert(dataToUpsert, {
      onConflict: 'user_id',
    })
    .select();

  if (error) {
    console.error('Supabase Upsert Error:', error);
    return { success: false, message: `Database error: ${error.message}` };
  }

  revalidatePath('/applications/bio-data');
  redirect(`${PATHS.DOCUMENTS}?payment_verified=true`);
}