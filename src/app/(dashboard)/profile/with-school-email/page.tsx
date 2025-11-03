// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/stores/useProfileStore'; // Import store and type

// Define types for local component state if different or for clarity
interface FormData {
  firstName: string;
  lastName: string;
  classValue: string;
  tenantEmailInput: string; // User's input for tenant email
}

interface VerifiedTenantInfo {
  id: string;
  name: string;
  email: string;
}

const CLASS_OPTIONS = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3', 'None'];

export default function EditProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Zustand store integration
  const {
    profile: storeProfile,
    isLoading: storeIsLoading,
    error: storeError,
    fetchUserProfile,
    updateProfile,
  } = useProfileStore();

  // Local form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    classValue: 'None',
    tenantEmailInput: '',
  });

  const [fetchedTenantNameDisplay, setFetchedTenantNameDisplay] = useState<string>('');
  const [verifiedTenantForSave, setVerifiedTenantForSave] = useState<VerifiedTenantInfo | null>(null);
  const [tenantLookupStatus, setTenantLookupStatus] = useState<'idle' | 'pending' | 'success' | 'not_found' | 'error'>('idle');
  const [tenantLookupMessage, setTenantLookupMessage] = useState<string | null>(null);
  
  const [isLookingUpTenant, setIsLookingUpTenant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For main form submission

  // Effect to load profile from store or fetch if not available
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session.user.email) {
      if (!storeProfile && !storeIsLoading) {
        fetchUserProfile(session.user.email);
      }
    }
  }, [sessionStatus, session, storeProfile, storeIsLoading, fetchUserProfile]);

  // Effect to populate form when profile data is loaded into the store
  useEffect(() => {
    if (storeProfile) {
      setFormData({
        firstName: storeProfile.firstName || '',
        lastName: storeProfile.lastName || '',
        classValue: storeProfile.classValue || 'None',
        tenantEmailInput: storeProfile.associatedTenantEmail || '',
      });
      if (storeProfile.associatedTenantName) {
        setFetchedTenantNameDisplay(storeProfile.associatedTenantName);
      } else {
        setFetchedTenantNameDisplay('');
      }
      if (storeProfile.tenantId && storeProfile.associatedTenantName && storeProfile.associatedTenantEmail) {
        setVerifiedTenantForSave({
          id: storeProfile.tenantId,
          name: storeProfile.associatedTenantName,
          email: storeProfile.associatedTenantEmail,
        });
        setTenantLookupStatus('success'); // If tenant info is pre-loaded
      } else {
        setVerifiedTenantForSave(null);
        setTenantLookupStatus('idle');
      }
    }
  }, [storeProfile]);

  const handleTenantEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, tenantEmailInput: e.target.value });
    // If user changes email, reset verification
    if (tenantLookupStatus !== 'idle' || verifiedTenantForSave) {
        setTenantLookupStatus('idle');
        setFetchedTenantNameDisplay('');
        setVerifiedTenantForSave(null);
        setTenantLookupMessage(null);
    }
  };

  const handleGetSchoolName = async () => {
    if (!formData.tenantEmailInput.trim()) {
      setTenantLookupMessage('Please enter a school email.');
      setTenantLookupStatus('error');
      return;
    }
    setIsLookingUpTenant(true);
    setTenantLookupStatus('pending');
    setTenantLookupMessage(null);
    setFetchedTenantNameDisplay('');
    setVerifiedTenantForSave(null);

    try {
      const response = await fetch(`/api/tenants/verify?email=${encodeURIComponent(formData.tenantEmailInput)}`);
      const data = await response.json();

      if (response.ok) {
        setVerifiedTenantForSave(data as VerifiedTenantInfo);
        setFetchedTenantNameDisplay(data.name);
        setTenantLookupStatus('success');
        setTenantLookupMessage('School identified.');
      } else {
        setVerifiedTenantForSave(null);
        setTenantLookupStatus(response.status === 404 ? 'not_found' : 'error');
        setTenantLookupMessage(data.error || 'Failed to verify school.');
      }
    } catch (err) {
      setVerifiedTenantForSave(null);
      setTenantLookupStatus('error');
      setTenantLookupMessage('An unexpected error occurred during verification.');
      console.error('Verify tenant error:', err);
    } finally {
      setIsLookingUpTenant(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user.email) {
      setTenantLookupMessage("User session not found. Please re-login."); // Or use storeError
      return;
    }

    // Condition: if tenant email is entered, it must be successfully verified
    if (formData.tenantEmailInput.trim() && tenantLookupStatus !== 'success') {
        setTenantLookupMessage('Please verify the school email or clear it if you do not want to associate with a school.');
        return;
    }

    setIsSubmitting(true);
    const success = await updateProfile(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        classValue: formData.classValue,
        tenantId: verifiedTenantForSave?.id || null,
      },
      session.user.email
    );
    setIsSubmitting(false);

    if (success) {
      router.push('/dashboard'); // Or a success message page/toast
    }
    // Error handling is managed by the store and displayed via storeError
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && storeIsLoading && !storeProfile)) {
    return <div className="max-w-2xl mx-auto p-6 text-center">Loading profile...</div>;
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/signin'); // Or your sign-in page
    return null;
  }
  
  // General error from store (e.g. initial fetch failure)
  // Specific lookup errors are handled by tenantLookupMessage
  const displayError = storeError && tenantLookupStatus === 'idle' ? storeError : tenantLookupMessage;


  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              id="firstName"
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              id="lastName"
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="classValue" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select
            id="classValue"
            value={formData.classValue}
            onChange={(e) => { setFormData({ ...formData, classValue: e.target.value }); }}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {CLASS_OPTIONS.map((classOption) => (
              <option key={classOption} value={classOption}>
                {classOption}
              </option>
            ))}
          </select>
        </div>

        {/* School Association Section */}
        <div className="space-y-3 p-4 border border-gray-200 rounded-md">
            <h2 className="text-lg font-medium text-gray-800">School Association</h2>
          <div>
            <label htmlFor="tenantEmailInput" className="block text-sm font-medium text-gray-700 mb-1">School Email (Optional)</label>
            <div className="flex items-center gap-2">
              <input
                id="tenantEmailInput"
                type="email"
                placeholder="Enter school's contact email"
                value={formData.tenantEmailInput}
                onChange={handleTenantEmailInputChange}
                className="p-2 border border-gray-300 rounded-md shadow-sm flex-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleGetSchoolName}
                disabled={isLookingUpTenant || !formData.tenantEmailInput.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {isLookingUpTenant ? 'Verifying...' : 'Get School Name'}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="fetchedTenantName" className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input
                id="fetchedTenantName"
                type="text"
                readOnly
                value={fetchedTenantNameDisplay || '---'}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 shadow-sm"
            />
          </div>

          {tenantLookupStatus === 'pending' && <p className="text-sm text-blue-600">Looking up school...</p>}
          {/* tenantLookupMessage will display success, not_found, or error messages for the lookup */}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || storeIsLoading || (formData.tenantEmailInput.trim() !== '' && tenantLookupStatus !== 'success')}
          className="w-full p-3 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isSubmitting || storeIsLoading ? 'Saving...' : 'Save Profile'}
        </button>

        {displayError && (
          <div className={`p-3 rounded-md text-sm ${tenantLookupStatus === 'error' || (storeError && tenantLookupStatus === 'idle') ? 'bg-red-50 text-red-700' : 
                                               tenantLookupStatus === 'not_found' ? 'bg-yellow-50 text-yellow-700' :
                                               tenantLookupStatus === 'success' ? 'bg-green-50 text-green-700' : ''}`}>
            {displayError}
          </div>
        )}
      </form>
    </div>
  );
}