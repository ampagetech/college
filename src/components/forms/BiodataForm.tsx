// FULL AND CORRECT BiodataForm.tsx

"use client";

import { useEffect, useState } from 'react';
import locationData from '@/lib/data/state-lgas.json';

// --- CONSTANTS ---
const STATES: string[] = locationData.states;
const LGAS_BY_STATE: Record<string, string[]> = locationData.lgasByState;

// --- TYPE DEFINITIONS ---
interface Faculty {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
  faculty_id: string;
}

type BiodataFormFields = {
  surname: string;
  firstName: string;
  middleName: string | null;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  stateOfOrigin: string;
  lga: string;
  religion: string;
  address: string;
  phoneNumber: string;
  disability: string | null;
  healthChallenge: string | null;
  guardianName: string;
  guardianAddress: string;
  guardianOccupation: string;
  guardianRelationship: string;
  guardianPhoneNumber: string;
  schoolName: string;
  yearOfEntry: number | null;
  yearOfGraduation: number | null;
  qualificationObtained: string;
  schoolName2: string | null;
  yearOfEntry2: number | null;
  yearOfGraduation2: number | null;
  qualificationObtained2: string | null;
  schoolName3: string | null;
  yearOfEntry3: number | null;
  yearOfGraduation3: number | null;
  qualificationObtained3: string | null;
  jambRegistrationNumber: string;
  firstChoiceFacultyId: string;
  firstChoiceCourseId: string;
  secondChoiceFacultyId: string;
  secondChoiceCourseId: string;
};

interface BiodataFormProps {
  formData: BiodataFormFields;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors?: Partial<Record<keyof BiodataFormFields, string[]>> | null;
  faculties: Faculty[];
  courses: Course[];
}

// --- HELPER COMPONENTS ---
const FormSection = ({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element => (
  <div className="mt-12 first:mt-0">
    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
      {title}
    </h2>
    <div className="mt-6">
      {children}
    </div>
  </div>
);

interface FieldErrorProps {
  fieldName: keyof BiodataFormFields;
  errors?: Partial<Record<keyof BiodataFormFields, string[]>> | null;
}

const FieldError = ({ fieldName, errors }: FieldErrorProps): React.JSX.Element | null => {
  const fieldErrors = errors?.[fieldName];
  if (!fieldErrors || fieldErrors.length === 0) return null;
  return (
    <div className="mt-1">
      {fieldErrors.map((error, index) => (
        <p key={index} className="text-xs text-red-500">{error}</p>
      ))}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function BiodataForm({
  formData,
  handleInputChange,
  errors,
  faculties,
  courses,
}: BiodataFormProps): React.JSX.Element {
  const [lgaOptions, setLgaOptions] = useState<string[]>([]);
  const [firstChoiceCourses, setFirstChoiceCourses] = useState<Course[]>([]);
  const [secondChoiceCourses, setSecondChoiceCourses] = useState<Course[]>([]);

  // Define currentYear inside the component
  const currentYear = new Date().getFullYear();

  // Handle LGA options based on selected state
  useEffect(() => {
    if (formData.stateOfOrigin) {
      const selectedStateLGAs = LGAS_BY_STATE[formData.stateOfOrigin] ?? [];
      setLgaOptions(selectedStateLGAs);
      if (!selectedStateLGAs.includes(formData.lga)) {
        handleInputChange({ target: { name: 'lga', value: '' } } as any);
      }
    } else {
      setLgaOptions([]);
    }
  }, [formData.stateOfOrigin, formData.lga]);

  // Filter first choice courses based on selected faculty
  useEffect(() => {
    if (formData.firstChoiceFacultyId) {
      const facultyCourses = courses.filter(c => c.faculty_id === formData.firstChoiceFacultyId);
      setFirstChoiceCourses(facultyCourses);
      if (formData.firstChoiceCourseId && !facultyCourses.some(c => c.id === formData.firstChoiceCourseId)) {
        handleInputChange({ target: { name: 'firstChoiceCourseId', value: '' } } as any);
      }
    } else {
      setFirstChoiceCourses([]);
      if (formData.firstChoiceCourseId) {
        handleInputChange({ target: { name: 'firstChoiceCourseId', value: '' } } as any);
      }
    }
  }, [formData.firstChoiceFacultyId, courses]);

  // Filter second choice courses based on selected faculty
  useEffect(() => {
    if (formData.secondChoiceFacultyId) {
      const facultyCourses = courses.filter(c => c.faculty_id === formData.secondChoiceFacultyId);
      setSecondChoiceCourses(facultyCourses);
      if (formData.secondChoiceCourseId && !facultyCourses.some(c => c.id === formData.secondChoiceCourseId)) {
        handleInputChange({ target: { name: 'secondChoiceCourseId', value: '' } } as any);
      }
    } else {
      setSecondChoiceCourses([]);
      if (formData.secondChoiceCourseId) {
        handleInputChange({ target: { name: 'secondChoiceCourseId', value: '' } } as any);
      }
    }
  }, [formData.secondChoiceFacultyId, courses]);

  return (
    <>
      {/* =================================================================
          SECTION 1: PERSONAL INFORMATION
          ================================================================= */}
      <FormSection title="Part 1: Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Surname */}
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">
              Surname <span className="text-red-500">*</span>
            </label>
            <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.surname ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="surname" errors={errors} />
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.firstName ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="firstName" errors={errors} />
          </div>

          {/* Middle Name */}
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            <input type="text" id="middleName" name="middleName" value={formData.middleName || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <FieldError fieldName="middleName" errors={errors} />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.gender ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <FieldError fieldName="gender" errors={errors} />
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="dateOfBirth" errors={errors} />
          </div>

          {/* Marital Status */}
          <div>
            <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status <span className="text-red-500">*</span>
            </label>
            <select id="maritalStatus" name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.maritalStatus ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
            <FieldError fieldName="maritalStatus" errors={errors} />
          </div>

          {/* State of Origin */}
          <div>
            <label htmlFor="stateOfOrigin" className="block text-sm font-medium text-gray-700 mb-1">
              State of Origin <span className="text-red-500">*</span>
            </label>
            <select id="stateOfOrigin" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.stateOfOrigin ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select State</option>
              {STATES.map(state => (<option key={state} value={state}>{state}</option>))}
            </select>
            <FieldError fieldName="stateOfOrigin" errors={errors} />
          </div>

          {/* LGA */}
          <div>
            <label htmlFor="lga" className="block text-sm font-medium text-gray-700 mb-1">
              LGA <span className="text-red-500">*</span>
            </label>
            <select id="lga" name="lga" value={formData.lga} onChange={handleInputChange} required disabled={!formData.stateOfOrigin || lgaOptions.length === 0} className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${errors?.lga ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select LGA</option>
              {lgaOptions.map(lga => (<option key={lga} value={lga}>{lga}</option>))}
            </select>
            <FieldError fieldName="lga" errors={errors} />
          </div>

          {/* Religion */}
          <div>
            <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-1">
              Religion <span className="text-red-500">*</span>
            </label>
            <select id="religion" name="religion" value={formData.religion} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.religion ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select Religion</option>
              <option value="Christianity">Christianity</option>
              <option value="Islam">Islam</option>
              <option value="Traditional">Traditional</option>
              <option value="Other">Other</option>
            </select>
            <FieldError fieldName="religion" errors={errors} />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.phoneNumber ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="phoneNumber" errors={errors} />
          </div>
        </div>

        {/* Full Width Fields for Personal Info */}
        <div className="mt-6 grid grid-cols-1 gap-6">
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} required rows={3} className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.address ? 'border-red-500' : 'border-gray-300'}`}></textarea>
            <p className="mt-1 text-xs text-gray-500">Please provide a detailed address (min. 10 characters).</p>
            <FieldError fieldName="address" errors={errors} />
          </div>

          {/* Disability */}
          <div>
            <label htmlFor="disability" className="block text-sm font-medium text-gray-700 mb-1">Disability (if any)</label>
            <input type="text" id="disability" name="disability" value={formData.disability || ''} onChange={handleInputChange} placeholder="Leave blank if none" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <FieldError fieldName="disability" errors={errors} />
          </div>

          {/* Health Challenge */}
          <div>
            <label htmlFor="healthChallenge" className="block text-sm font-medium text-gray-700 mb-1">Health Challenge (if any)</label>
            <input type="text" id="healthChallenge" name="healthChallenge" value={formData.healthChallenge || ''} onChange={handleInputChange} placeholder="Leave blank if none" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <FieldError fieldName="healthChallenge" errors={errors} />
          </div>
        </div>
      </FormSection>

      {/* =================================================================
          SECTION 2: GUARDIAN INFORMATION
          ================================================================= */}
      <FormSection title="Part 2: Guardian Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guardian Name */}
          <div>
            <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-1">
              Guardian Name <span className="text-red-500">*</span>
            </label>
            <input type="text" id="guardianName" name="guardianName" value={formData.guardianName} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.guardianName ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="guardianName" errors={errors} />
          </div>

          {/* Guardian Relationship */}
          <div>
            <label htmlFor="guardianRelationship" className="block text-sm font-medium text-gray-700 mb-1">
              Relationship <span className="text-red-500">*</span>
            </label>
            <select id="guardianRelationship" name="guardianRelationship" value={formData.guardianRelationship} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.guardianRelationship ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select Relationship</option>
              <option value="Father">Father</option><option value="Mother">Mother</option><option value="Uncle">Uncle</option><option value="Aunt">Aunt</option><option value="Brother">Brother</option><option value="Sister">Sister</option><option value="Guardian">Guardian</option><option value="Other">Other</option>
            </select>
            <FieldError fieldName="guardianRelationship" errors={errors} />
          </div>

          {/* Guardian Occupation */}
          <div>
            <label htmlFor="guardianOccupation" className="block text-sm font-medium text-gray-700 mb-1">
              Occupation <span className="text-red-500">*</span>
            </label>
            <input type="text" id="guardianOccupation" name="guardianOccupation" value={formData.guardianOccupation} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.guardianOccupation ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="guardianOccupation" errors={errors} />
          </div>

          {/* Guardian Phone Number */}
          <div>
            <label htmlFor="guardianPhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input type="tel" id="guardianPhoneNumber" name="guardianPhoneNumber" value={formData.guardianPhoneNumber} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.guardianPhoneNumber ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="guardianPhoneNumber" errors={errors} />
          </div>

          {/* Guardian Address */}
          <div className="md:col-span-2">
            <label htmlFor="guardianAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea id="guardianAddress" name="guardianAddress" value={formData.guardianAddress} onChange={handleInputChange} required rows={3} className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.guardianAddress ? 'border-red-500' : 'border-gray-300'}`}></textarea>
            <p className="mt-1 text-xs text-gray-500">Please provide a detailed address (min. 10 characters).</p>
            <FieldError fieldName="guardianAddress" errors={errors} />
          </div>
        </div>
      </FormSection>

      {/* =================================================================
          SECTION 3: EDUCATION & PROGRAM CHOICE
          ================================================================= */}
      <FormSection title="Part 3: Education & Program Choice">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Educational Background</h3>
        
        {/* === MOST RECENT SCHOOL (REQUIRED) === */}
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
          <h4 className="text-md font-semibold text-gray-800 mb-4 text-blue-800">Most Recent School Attended</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">School Name <span className="text-red-500">*</span></label>
              <input type="text" id="schoolName" name="schoolName" value={formData.schoolName} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.schoolName ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="schoolName" errors={errors} />
            </div>
            <div>
              <label htmlFor="yearOfEntry" className="block text-sm font-medium text-gray-700 mb-1">Year of Entry <span className="text-red-500">*</span></label>
              <input type="number" id="yearOfEntry" name="yearOfEntry" value={formData.yearOfEntry || ''} onChange={handleInputChange} required min="1990" max={currentYear.toString()} placeholder="YYYY" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.yearOfEntry ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="yearOfEntry" errors={errors} />
            </div>
            <div>
              <label htmlFor="yearOfGraduation" className="block text-sm font-medium text-gray-700 mb-1">Year of Graduation <span className="text-red-500">*</span></label>
              <input type="number" id="yearOfGraduation" name="yearOfGraduation" value={formData.yearOfGraduation || ''} onChange={handleInputChange} required min="1990" max={(currentYear + 7).toString()} placeholder="YYYY" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.yearOfGraduation ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="yearOfGraduation" errors={errors} />
            </div>
            <div>
              <label htmlFor="qualificationObtained" className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification <span className="text-red-500">*</span></label>
              <select id="qualificationObtained" name="qualificationObtained" value={formData.qualificationObtained} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.qualificationObtained ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select Qualification</option><option value="SSCE">SSCE (WAEC/NECO)</option><option value="GCE">GCE</option><option value="NABTEB">NABTEB</option><option value="OND">OND</option><option value="HND">HND</option><option value="NCE">NCE</option><option value="DEGREE">Bachelor's Degree</option><option value="IJMB">IJMB</option><option value="JUPEB">JUPEB</option><option value="Other">Other</option>
              </select>
              <FieldError fieldName="qualificationObtained" errors={errors} />
            </div>
          </div>
        </div>

        {/* === SECOND PREVIOUS SCHOOL (OPTIONAL) === */}
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500 mb-8">
          <h4 className="text-md font-semibold text-gray-800 mb-2 text-green-800">Other Previous School (e.g., Secondary/Tertiary)</h4>
          <p className="text-sm text-gray-600 mb-4">Optional: Fill this in if you attended another relevant institution.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="schoolName2" className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input type="text" id="schoolName2" name="schoolName2" value={formData.schoolName2 || ''} onChange={handleInputChange} className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.schoolName2 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="schoolName2" errors={errors} />
            </div>
            <div>
              <label htmlFor="yearOfEntry2" className="block text-sm font-medium text-gray-700 mb-1">Year of Entry</label>
              <input type="number" id="yearOfEntry2" name="yearOfEntry2" value={formData.yearOfEntry2 || ''} onChange={handleInputChange} min="1990" max={currentYear.toString()} placeholder="YYYY" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.yearOfEntry2 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="yearOfEntry2" errors={errors} />
            </div>
            <div>
              <label htmlFor="yearOfGraduation2" className="block text-sm font-medium text-gray-700 mb-1">Year of Graduation</label>
              <input type="number" id="yearOfGraduation2" name="yearOfGraduation2" value={formData.yearOfGraduation2 || ''} onChange={handleInputChange} min="1990" max={(currentYear + 7).toString()} placeholder="YYYY" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.yearOfGraduation2 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="yearOfGraduation2" errors={errors} />
            </div>
            <div>
              <label htmlFor="qualificationObtained2" className="block text-sm font-medium text-gray-700 mb-1">Qualification Obtained</label>
              <input type="text" id="qualificationObtained2" name="qualificationObtained2" value={formData.qualificationObtained2 || ''} onChange={handleInputChange} placeholder="e.g., SSCE, OND" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.qualificationObtained2 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="qualificationObtained2" errors={errors} />
            </div>
          </div>
        </div>
        
        {/* === THIRD PREVIOUS SCHOOL (OPTIONAL) === */}
        <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500 mb-8">
          <h4 className="text-md font-semibold text-gray-800 mb-2 text-orange-800">Other Previous School (e.g., Primary)</h4>
           <p className="text-sm text-gray-600 mb-4">Optional: You can add another school here if needed.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="schoolName3" className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input type="text" id="schoolName3" name="schoolName3" value={formData.schoolName3 || ''} onChange={handleInputChange} className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.schoolName3 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="schoolName3" errors={errors} />
            </div>
            <div>
              <label htmlFor="yearOfEntry3" className="block text-sm font-medium text-gray-700 mb-1">Year of Entry</label>
              <input type="number" id="yearOfEntry3" name="yearOfEntry3" value={formData.yearOfEntry3 || ''} onChange={handleInputChange} min="1990" max={currentYear.toString()} placeholder="YYYY" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.yearOfEntry3 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="yearOfEntry3" errors={errors} />
            </div>
            <div>
              <label htmlFor="yearOfGraduation3" className="block text-sm font-medium text-gray-700 mb-1">Year of Graduation</label>
              <input type="number" id="yearOfGraduation3" name="yearOfGraduation3" value={formData.yearOfGraduation3 || ''} onChange={handleInputChange} min="1990" max={(currentYear + 7).toString()} placeholder="YYYY" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.yearOfGraduation3 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="yearOfGraduation3" errors={errors} />
            </div>
            <div>
              <label htmlFor="qualificationObtained3" className="block text-sm font-medium text-gray-700 mb-1">Qualification Obtained</label>
              <input type="text" id="qualificationObtained3" name="qualificationObtained3" value={formData.qualificationObtained3 || ''} onChange={handleInputChange} placeholder="e.g., FSLC, SSCE" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.qualificationObtained3 ? 'border-red-500' : 'border-gray-300'}`} />
              <FieldError fieldName="qualificationObtained3" errors={errors} />
            </div>
          </div>
        </div>

        <hr className="my-8 border-gray-200" />

        {/* --- JAMB and Program Choice --- */}
        <div className="grid grid-cols-1 md:col-span-2 gap-6">
           {/* JAMB Reg Number */}
          <div className="md:col-span-2">
            <label htmlFor="jambRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
              JAMB Reg. Number <span className="text-red-500">*</span>
            </label>
            <input type="text" id="jambRegistrationNumber" name="jambRegistrationNumber" value={formData.jambRegistrationNumber} onChange={handleInputChange} required maxLength={14} minLength={8} placeholder="e.g., 202412345678AB" className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.jambRegistrationNumber ? 'border-red-500' : 'border-gray-300'}`} />
            <FieldError fieldName="jambRegistrationNumber" errors={errors} />
          </div>
        </div>

        <hr className="my-8 border-gray-200" />
        
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Course Selection</h3>
        <p className="text-sm text-gray-600 mb-4">Select your desired faculty and course of study.</p>
        
        {/* --- First Choice Selection --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 p-4 border rounded-md bg-gray-50 mb-6">
          <div className="md:col-span-2"><h4 className="font-semibold text-gray-700">First Choice</h4></div>
          <div>
            <label htmlFor="firstChoiceFacultyId" className="block text-sm font-medium text-gray-700 mb-1">Faculty <span className="text-red-500">*</span></label>
            <select id="firstChoiceFacultyId" name="firstChoiceFacultyId" value={formData.firstChoiceFacultyId} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.firstChoiceFacultyId ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select a Faculty</option>
              {faculties.map(faculty => (<option key={faculty.id} value={faculty.id}>{faculty.name}</option>))}
            </select>
            <FieldError fieldName="firstChoiceFacultyId" errors={errors} />
          </div>
          <div>
            <label htmlFor="firstChoiceCourseId" className="block text-sm font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
            <select id="firstChoiceCourseId" name="firstChoiceCourseId" value={formData.firstChoiceCourseId} onChange={handleInputChange} required disabled={!formData.firstChoiceFacultyId || firstChoiceCourses.length === 0} className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${errors?.firstChoiceCourseId ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select a Course</option>
              {firstChoiceCourses.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}
            </select>
            <FieldError fieldName="firstChoiceCourseId" errors={errors} />
          </div>
        </div>

        {/* --- Second Choice Selection --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 p-4 border rounded-md bg-gray-50">
          <div className="md:col-span-2"><h4 className="font-semibold text-gray-700">Second Choice</h4></div>
          <div>
            <label htmlFor="secondChoiceFacultyId" className="block text-sm font-medium text-gray-700 mb-1">Faculty <span className="text-red-500">*</span></label>
            <select id="secondChoiceFacultyId" name="secondChoiceFacultyId" value={formData.secondChoiceFacultyId} onChange={handleInputChange} required className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.secondChoiceFacultyId ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select a Faculty</option>
              {faculties.map(faculty => (<option key={faculty.id} value={faculty.id}>{faculty.name}</option>))}
            </select>
            <FieldError fieldName="secondChoiceFacultyId" errors={errors} />
          </div>
          <div>
            <label htmlFor="secondChoiceCourseId" className="block text-sm font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
            <select id="secondChoiceCourseId" name="secondChoiceCourseId" value={formData.secondChoiceCourseId} onChange={handleInputChange} required disabled={!formData.secondChoiceFacultyId || secondChoiceCourses.length === 0} className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${errors?.secondChoiceCourseId ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select a Course</option>
              {secondChoiceCourses.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}
            </select>
            <FieldError fieldName="secondChoiceCourseId" errors={errors} />
          </div>
        </div>
      </FormSection>
    </>
  );
}