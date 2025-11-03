'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Database } from '@/types/supabase';
import { upsertBioData, State, Faculty, Course } from '@/app/(dashboard)/applications/bio-data/actions';
import BiodataForm from './BiodataForm';
import { useFocusOnFirstError } from '@/hooks/useFocusOnFirstError';

type Application = Database['public']['Tables']['applications']['Row'];

// This type represents the full state of the form on the client.
type ClientBioDataFormData = {
  surname: string; firstName: string; middleName: string | null; gender: string; dateOfBirth: string;
  maritalStatus: string; stateOfOrigin: string; lga: string; religion: string;
  address: string; phoneNumber: string; disability: string | null; healthChallenge: string | null;
  guardianName: string; guardianAddress: string; guardianOccupation: string;
  guardianRelationship: string; guardianPhoneNumber: string;
  schoolName: string; yearOfEntry: number | null; yearOfGraduation: number | null; qualificationObtained: string;
  schoolName2: string | null; yearOfEntry2: number | null; yearOfGraduation2: number | null; qualificationObtained2: string | null;
  schoolName3: string | null; yearOfEntry3: number | null; yearOfGraduation3: number | null; qualificationObtained3: string | null;
  jambRegistrationNumber: string;
  firstChoiceFacultyId: string;
  firstChoiceCourseId: string;
  secondChoiceFacultyId: string;
  secondChoiceCourseId: string;
};

interface BiodataFormWrapperProps {
  initialData: Application | null;
  hasPayment: boolean;
  paymentId?: string | null;
  faculties: Faculty[];
  courses: Course[];
}

function SubmitButton({ hasPayment }: { hasPayment: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || !hasPayment;
  return (
    <div className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={isDisabled}
        className="mt-4 px-8 py-2 font-semibold rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        aria-disabled={isDisabled}
      >
        {pending ? 'Saving...' : 'Save & Continue'}
      </button>
    </div>
  );
}

const createDefaultState = (): ClientBioDataFormData => ({
  surname: '', firstName: '', middleName: '', gender: '', dateOfBirth: '', maritalStatus: '',
  stateOfOrigin: '', lga: '', religion: '', address: '', phoneNumber: '',
  disability: '', healthChallenge: '', guardianName: '', guardianAddress: '',
  guardianOccupation: '', guardianRelationship: '', guardianPhoneNumber: '',
  schoolName: '', yearOfEntry: null, yearOfGraduation: null, qualificationObtained: '',
  schoolName2: '', yearOfEntry2: null, yearOfGraduation2: null, qualificationObtained2: '',
  schoolName3: '', yearOfEntry3: null, yearOfGraduation3: null, qualificationObtained3: '',
  jambRegistrationNumber: '',
  firstChoiceFacultyId: '', firstChoiceCourseId: '',
  secondChoiceFacultyId: '', secondChoiceCourseId: '',
});

export default function BiodataFormWrapper({ 
  initialData, 
  hasPayment, 
  paymentId,
  faculties,
  courses
}: BiodataFormWrapperProps): React.JSX.Element {
  const router = useRouter();

  const [formData, setFormData] = useState<ClientBioDataFormData>(() => {
    if (!initialData) return createDefaultState();

    // Find the full course object using the ID from the database
    const firstCourse = courses.find(c => c.id === initialData.first_choice_course_id);
    const secondCourse = courses.find(c => c.id === initialData.second_choice_course_id);

    return {
      // Map all fields from snake_case (DB) to camelCase (client state)
      surname: initialData.surname || '',
      firstName: initialData.first_name || '',
      middleName: initialData.middle_name || '',
      gender: initialData.gender || '',
      dateOfBirth: initialData.date_of_birth || '',
      maritalStatus: initialData.marital_status || '',
      stateOfOrigin: initialData.state_of_origin || '',
      lga: initialData.lga || '',
      religion: initialData.religion || '',
      address: initialData.address || '',
      phoneNumber: initialData.phone_number || '',
      disability: initialData.disability || '',
      healthChallenge: initialData.health_challenge || '',
      guardianName: initialData.guardian_name || '',
      guardianAddress: initialData.guardian_address || '',
      guardianOccupation: initialData.guardian_occupation || '',
      guardianRelationship: initialData.guardian_relationship || '',
      guardianPhoneNumber: initialData.guardian_phone_number || '',
      schoolName: initialData.school_name || '',
      yearOfEntry: initialData.year_of_entry || null,
      yearOfGraduation: initialData.year_of_graduation || null,
      qualificationObtained: initialData.qualification_obtained || '',
      schoolName2: initialData.school_name_2 || '',
      yearOfEntry2: initialData.year_of_entry_2 || null,
      yearOfGraduation2: initialData.year_of_graduation_2 || null,
      qualificationObtained2: initialData.qualification_obtained_2 || '',
      schoolName3: initialData.school_name_3 || '',
      yearOfEntry3: initialData.year_of_entry_3 || null,
      yearOfGraduation3: initialData.year_of_graduation_3 || null,
      qualificationObtained3: initialData.qualification_obtained_3 || '',
      jambRegistrationNumber: initialData.jamb_registration_number || '',
      
      // Set the course ID from the database
      firstChoiceCourseId: initialData.first_choice_course_id || '',
      secondChoiceCourseId: initialData.second_choice_course_id || '',
      
      // DERIVE the faculty ID from the course object we found.
      firstChoiceFacultyId: firstCourse?.faculty_id || '',
      secondChoiceFacultyId: secondCourse?.faculty_id || '',
    };
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    if (e.target.type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const initialState: State = { message: null, errors: null, success: false };
  const [state, formAction] = useFormState(upsertBioData, initialState);
  const formRef = useFocusOnFirstError(state.errors);

  useEffect((): void => {
    if (state.success) {
      toast.success(state.message || 'Data saved successfully!');
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div>
      <form action={formAction} ref={formRef}>
        <BiodataForm
          formData={formData}
          handleInputChange={handleInputChange}
          errors={state.errors}
          faculties={faculties}
          courses={courses}
        />
        <input
          type="hidden"
          name="jsonData"
          value={JSON.stringify({
            ...formData,
            firstChoiceFacultyId: undefined, 
            secondChoiceFacultyId: undefined
          })}
        />
        <div className="mt-6 flex items-start gap-4">
          <div className="flex-1">
            <SubmitButton hasPayment={hasPayment} />
          </div>
          {state.message && !state.success && (
            <p aria-live="polite" className="text-sm text-red-500 mt-6">
              {state.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}