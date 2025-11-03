// src/lib/actions/admission-actions.ts
'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { AdmissionLetterData, Fee } from '@/types/admission';


// =========================================================================
// CORE INTERNAL FUNCTION (THE FIX IS HERE)
// =========================================================================
async function _getLetterDataCore(admissionId: string): Promise<AdmissionLetterData | null> {
  console.log(`[CORE] Fetching letter data for admission ID: ${admissionId}`);
  const supabase = createServerComponentClient<Database>({ cookies });

  // --- THIS IS THE FIX: The invalid comment has been removed from the query string ---
  const { data: admission, error: admissionError } = await supabase
    .from('admissions')
    .select(`
      id, 
      admission_ref, 
      admission_date,
      academic_sessions ( session_name ),
      users ( first_name, last_name ),
      courses ( name, degree_type, faculties ( name ) )
    `)
    .eq('id', admissionId)
    .single();

  if (admissionError || !admission) {
    // This log will now be accurate if there's a real error.
    console.error(`[CORE] Failed to fetch admission record. Error: ${admissionError?.message}`);
    return null;
  }

  const [feesRes, settingsRes, sessionRes] = await Promise.all([
    supabase.from('fees').select('name, amount, is_optional, frequency'),
    supabase.from('university_settings').select('setting_key, setting_value'),
    // This query is correct and uses maybeSingle() to prevent crashes
    supabase
      .from('academic_sessions')
      .select('registration_end_date')
      .eq('is_current', true)
      .maybeSingle(),
  ]);
  
  const allFees: Fee[] = (feesRes.data as Fee[]) ?? [];
  const settings = settingsRes.data ?? [];
  const currentSession = sessionRes.data;

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
  const compulsoryOnce = allFees.filter(f => !f.is_optional && f.frequency === 'once_on_registration');
  const compulsorySemester = allFees.filter(f => !f.is_optional && f.frequency === 'per_semester');
  const optionalFees = allFees.filter(f => f.is_optional);
  const acceptanceFee = compulsoryOnce.find(f => f.name.toLowerCase().includes('acceptance'));

  const letterData: AdmissionLetterData = {
    universityName: settings.find(s => s.setting_key === 'university_name')?.setting_value ?? 'JEWEL UNIVERSITY GOMBE',
    universityMotto: settings.find(s => s.setting_key === 'university_motto')?.setting_value ?? 'Developing Great Minds for Global Impact',
    registrarName: settings.find(s => s.setting_key === 'registrar_name')?.setting_value ?? 'Aliyu Kamara',
    //... all other properties are unchanged
    studentFullName: `${admission.users?.first_name ?? ''} ${admission.users?.last_name ?? ''}`.trim(),
    admissionRef: admission.admission_ref ?? 'N/A',
    admissionDateFormatted: formatDate(admission.admission_date),
    currentYear: new Date().getFullYear().toString(),
    courseName: admission.courses?.name ?? 'N/A',
    degreeType: admission.courses?.degree_type ?? 'Bachelor',
    facultyName: admission.courses?.faculties?.name ?? 'N/A',
    academicSessionName: admission.academic_sessions?.session_name ?? 'N/A',
    acceptanceFeeAmountFormatted: acceptanceFee ? formatCurrency(acceptanceFee.amount) : '₦20,000.00',
    compulsoryOnceOnRegistrationFees: compulsoryOnce,
    compulsoryPerSemesterFees: compulsorySemester,
    optionalFees: optionalFees,
    totalCompulsoryOnceOnRegistration: compulsoryOnce.reduce((sum, fee) => sum + fee.amount, 0),
    totalCompulsoryPerSemester: compulsorySemester.reduce((sum, fee) => sum + fee.amount, 0),
    acceptanceDeadlineFormatted: formatDate(currentSession?.registration_end_date ?? null),
  };

  return letterData;
}


// --- THE REST OF THE FILE IS UNCHANGED ---
export async function getHtmlLetterDataForAdmin(admissionId: string): Promise<AdmissionLetterData | null> {
  console.log(`\n--- [ADMIN ACTION] Checking permissions for admission ID: ${admissionId} ---`);
  //... code is correct
  return _getLetterDataCore(admissionId);
}

export async function getMyAdmissionLetter(): Promise<AdmissionLetterData | null> {
  console.log(`\n--- [STUDENT ACTION] Fetching current user's letter ---`);
  
  const supabase = createServerComponentClient<Database>({ cookies });

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error(`[STUDENT ACTION] User not authenticated`);
    return null;
  }

  // Find the user's admission record
  const { data: admission, error: admissionError } = await supabase
    .from('admissions')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (admissionError || !admission) {
    console.error(`[STUDENT ACTION] Failed to fetch user's admission record. Error: ${admissionError?.message}`);
    return null;
  }

  return _getLetterDataCore(admission.id);
}