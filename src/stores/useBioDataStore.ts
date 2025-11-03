// src/stores/useBioDataStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BioDataFormData {
  // Personal Information
  surname: string;
  firstName: string;
  middleName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  stateOfOrigin: string;
  lga: string;
  religion: string;
  address: string;
  phoneNumber: string;
  email: string;
  disability: string;
  healthChallenge: string;

  // Guardian Information
  guardianName: string;
  guardianAddress: string;
  guardianOccupation: string;
  guardianRelationship: string;
  guardianPhoneNumber: string;

  // Education Information
  schoolName: string;
  yearOfEntry: number | null;
  yearOfGraduation: number | null;
  qualificationObtained: string;
  firstChoice: string;
  secondChoice: string;
  jambRegistrationNumber: string;
}

export type SectionStatus = 'empty' | 'partial' | 'complete' | 'error';
export type SectionKey = 'personal' | 'guardian' | 'education';

export interface SectionInfo {
  title: string;
  path: string;
  requiredFields: (keyof BioDataFormData)[];
}

export const bioDataSections: Record<SectionKey, SectionInfo> = {
  personal: {
    title: 'Personal Information',
    path: '/applications/bio-data/personal',
    requiredFields: ['surname', 'firstName', 'gender', 'dateOfBirth', 'maritalStatus', 'stateOfOrigin', 'lga', 'religion', 'address', 'phoneNumber', 'email']
  },
  guardian: {
    title: 'Guardian Information',
    path: '/applications/bio-data/guardian',
    requiredFields: ['guardianName', 'guardianAddress', 'guardianOccupation', 'guardianRelationship', 'guardianPhoneNumber']
  },
  education: {
    title: 'Education Information',
    path: '/applications/bio-data/education',
    requiredFields: ['schoolName', 'yearOfEntry', 'yearOfGraduation', 'qualificationObtained', 'firstChoice', 'secondChoice', 'jambRegistrationNumber']
  }
};

interface BioDataStore {
  // Form data
  formData: BioDataFormData;
  applicationId: string | null;
  currentUserEmail: string | null;
  
  // Loading states
  isBioDataLoading: boolean;
  isSubmitting: boolean;
  
  // Status tracking
  sectionStatus: Record<SectionKey, SectionStatus>;
  hasVerifiedPayment: boolean;
  isInitialized: boolean;
  
  // Error handling
  bioDataError: string | null;
  validationErrors: string[];
  successMessage: string | null;
  
  // Actions
  setFormData: (data: Partial<BioDataFormData>) => void;
  setApplicationId: (id: string | null) => void;
  setCurrentUserEmail: (email: string | null) => void;
  setHasVerifiedPayment: (status: boolean) => void;
  setIsSubmitting: (loading: boolean) => void;
  setBioDataError: (error: string | null) => void;
  setValidationErrors: (errors: string[]) => void;
  setSuccessMessage: (message: string | null) => void;
  setIsInitialized: (initialized: boolean) => void;
  
  // Complex actions
  calculateSectionStatus: (sectionKey: SectionKey) => SectionStatus;
  calculateAllSectionStatuses: () => void;
  fetchInitialBioData: (userEmail: string) => Promise<void>;
  resetStore: () => void;
  initializeForUser: (userEmail: string) => void;
}

const getInitialFormData = (): BioDataFormData => ({
  surname: '',
  firstName: '',
  middleName: '',
  gender: '',
  dateOfBirth: '',
  maritalStatus: '',
  stateOfOrigin: '',
  lga: '',
  religion: '',
  address: '',
  phoneNumber: '',
  email: '',
  disability: '',
  healthChallenge: '',
  guardianName: '',
  guardianAddress: '',
  guardianOccupation: '',
  guardianRelationship: '',
  guardianPhoneNumber: '',
  schoolName: '',
  yearOfEntry: null,
  yearOfGraduation: null,
  qualificationObtained: '',
  firstChoice: '',
  secondChoice: '',
  jambRegistrationNumber: ''
});

const getInitialSectionStatus = (): Record<SectionKey, SectionStatus> => ({
  personal: 'empty',
  guardian: 'empty',
  education: 'empty'
});

export const getFieldDisplayName = (field: keyof BioDataFormData): string => {
  const displayNames: Record<keyof BioDataFormData, string> = {
    surname: 'Surname',
    firstName: 'First Name',
    middleName: 'Middle Name',
    gender: 'Gender',
    dateOfBirth: 'Date of Birth',
    maritalStatus: 'Marital Status',
    stateOfOrigin: 'State of Origin',
    lga: 'Local Government Area',
    religion: 'Religion',
    address: 'Address',
    phoneNumber: 'Phone Number',
    email: 'Email',
    disability: 'Disability',
    healthChallenge: 'Health Challenge',
    guardianName: 'Guardian Name',
    guardianAddress: 'Guardian Address',
    guardianOccupation: 'Guardian Occupation',
    guardianRelationship: 'Guardian Relationship',
    guardianPhoneNumber: 'Guardian Phone Number',
    schoolName: 'School Name',
    yearOfEntry: 'Year of Entry',
    yearOfGraduation: 'Year of Graduation',
    qualificationObtained: 'Qualification Obtained',
    firstChoice: 'First Choice',
    secondChoice: 'Second Choice',
    jambRegistrationNumber: 'JAMB Registration Number'
  };
  return displayNames[field] || field;
};

export const useBioDataStore = create<BioDataStore>()(
  persist(
    (set, get) => ({
      // Initial state
      formData: getInitialFormData(),
      applicationId: null,
      currentUserEmail: null,
      isBioDataLoading: false,
      isSubmitting: false,
      sectionStatus: getInitialSectionStatus(),
      hasVerifiedPayment: false,
      isInitialized: false,
      bioDataError: null,
      validationErrors: [],
      successMessage: null,

      // Simple setters
      setFormData: (data) => { set((state) => {
        const newFormData = { ...state.formData, ...data };
        console.log('Updated Form Data:', newFormData);
        return {
          formData: newFormData,
          validationErrors: [],
          successMessage: null,
          bioDataError: null
        };
      }); },

      setApplicationId: (id) => { set({ applicationId: id }); },
      
      setCurrentUserEmail: (email) => { set({ currentUserEmail: email }); },
      
      setHasVerifiedPayment: (status) => { set({ hasVerifiedPayment: status }); },
      
      setIsSubmitting: (loading) => { set({ isSubmitting: loading }); },
      
      setBioDataError: (error) => { set({ bioDataError: error }); },
      
      setValidationErrors: (errors) => { set({ validationErrors: errors }); },
      
      setSuccessMessage: (message) => { set({ successMessage: message }); },

      setIsInitialized: (initialized) => { set({ isInitialized: initialized }); },
      // Calculate section status
      calculateSectionStatus: (sectionKey: SectionKey) => {
        const { formData } = get();
        const section = bioDataSections[sectionKey];
        const requiredFields = section.requiredFields;
        
        let filledCount = 0;
        const totalRequired = requiredFields.length;
        
        for (const field of requiredFields) {
          const value = formData[field];
          if (value !== null && value !== undefined && value !== '') {
            filledCount++;
          }
        }
        
        if (filledCount === 0) return 'empty';
        if (filledCount === totalRequired) return 'complete';
        return 'partial';
      },

      calculateAllSectionStatuses: () => {
        const { calculateSectionStatus } = get();
        const newStatus: Record<SectionKey, SectionStatus> = {
          personal: calculateSectionStatus('personal'),
          guardian: calculateSectionStatus('guardian'),
          education: calculateSectionStatus('education')
        };
        set({ sectionStatus: newStatus });
      },

      // Initialize store for a specific user
      initializeForUser: (userEmail: string) => {
        const { currentUserEmail } = get();
        
        // If switching users, reset everything
        if (currentUserEmail && currentUserEmail !== userEmail) {
          set({
            formData: getInitialFormData(),
            applicationId: null,
            currentUserEmail: userEmail,
            sectionStatus: getInitialSectionStatus(),
            bioDataError: null,
            validationErrors: [],
            successMessage: null,
            isBioDataLoading: false,
            isSubmitting: false,
            isInitialized: false
          });
        } else if (!currentUserEmail) {
          // First time initialization
          set({
            currentUserEmail: userEmail,
            formData: { ...get().formData, email: userEmail },
            isInitialized: false
          });
        }
      },

      // Fetch initial bio data
      fetchInitialBioData: async (userEmail: string) => {
        const { initializeForUser } = get();
        
        initializeForUser(userEmail);
        
        set({ 
          isBioDataLoading: true, 
          bioDataError: null,
          validationErrors: [],
          successMessage: null
        });

        try {
          const response = await fetch('/api/applications/bio-data');
          
          if (response.status === 404) {
            set({ 
              isBioDataLoading: false,
              formData: { ...getInitialFormData(), email: userEmail }
            });
            get().calculateAllSectionStatuses();
            return;
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch bio data');
          }

          const applications = await response.json();
          
          if (applications && applications.length > 0) {
            const latestApp = applications[0];
            
            // FIX: Transform snake_case to camelCase AND coerce types
            const transformedData: BioDataFormData = {
              surname: latestApp.surname || '',
              firstName: latestApp.first_name || '',
              middleName: latestApp.middle_name || '',
              gender: latestApp.gender || '',
              dateOfBirth: latestApp.date_of_birth || '',
              maritalStatus: latestApp.marital_status || '',
              stateOfOrigin: latestApp.state_of_origin || '',
              lga: latestApp.lga || '',
              religion: latestApp.religion || '',
              address: latestApp.address || '',
              phoneNumber: latestApp.phone_number || '',
              email: latestApp.email || userEmail,
              disability: latestApp.disability || '',
              healthChallenge: latestApp.health_challenge || '',
              guardianName: latestApp.guardian_name || '',
              guardianAddress: latestApp.guardian_address || '',
              guardianOccupation: latestApp.guardian_occupation || '',
              guardianRelationship: latestApp.guardian_relationship || '',
              guardianPhoneNumber: latestApp.guardian_phone_number || '',
              schoolName: latestApp.school_name || '',
              // --- THIS IS THE FIX ---
              yearOfEntry: latestApp.year_of_entry ? parseInt(String(latestApp.year_of_entry), 10) : null,
              yearOfGraduation: latestApp.year_of_graduation ? parseInt(String(latestApp.year_of_graduation), 10) : null,
              // --- END OF FIX ---
              qualificationObtained: latestApp.qualification_obtained || '',
              firstChoice: latestApp.first_choice || '',
              secondChoice: latestApp.second_choice || '',
              jambRegistrationNumber: latestApp.jamb_registration_number || ''
            };

            set({
              formData: transformedData,
              applicationId: latestApp.id,
              isBioDataLoading: false
            });
          } else {
            set({
              formData: { ...getInitialFormData(), email: userEmail },
              isBioDataLoading: false
            });
          }

          get().calculateAllSectionStatuses();

        } catch (error: any) {
          console.error('Error fetching bio data:', error);
          set({
            bioDataError: error.message,
            isBioDataLoading: false,
            formData: { ...getInitialFormData(), email: userEmail }
          });
        }
      },

      // Reset store
      resetStore: () => { set({
        formData: getInitialFormData(),
        applicationId: null,
        currentUserEmail: null,
        isBioDataLoading: false,
        isSubmitting: false,
        sectionStatus: getInitialSectionStatus(),
        hasVerifiedPayment: false,
        bioDataError: null,
        validationErrors: [],
        successMessage: null
      }); }
    }),
    {
      name: 'biodata-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        formData: state.formData,
        applicationId: state.applicationId,
        currentUserEmail: state.currentUserEmail,
        sectionStatus: state.sectionStatus,
        hasVerifiedPayment: state.hasVerifiedPayment
      })
    }
  )
);