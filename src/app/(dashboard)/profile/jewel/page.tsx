// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation'; // Removed as it's not used
import { useProfileStore } from '@/stores/useProfileStore';

// Define types for local component state
interface FormData {
  firstName: string;
  lastName: string;
}

interface SubmissionMessage {
  type: 'success' | 'error';
  text: string;
}

export default function EditProfilePage() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession(); // ← ADD update
  // const router = useRouter(); // Removed as it's not used

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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<SubmissionMessage | null>(null);

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
      });
    }
  }, [storeProfile]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionMessage(null);

    if (!session?.user.email) {
      console.error("User session not found. Please re-login.");
      setSubmissionMessage({ type: 'error', text: 'User session not found. Please re-login.' });
      return;
    }

    if (!storeProfile) {
      console.error("Profile data not loaded. Cannot submit.");
      setSubmissionMessage({ type: 'error', text: 'Profile data not loaded. Please try again.' });
      return;
    }

    setIsSubmitting(true);

    const profileUpdatePayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      classValue: storeProfile.classValue || 'None',
      tenantId: storeProfile.tenantId || null,
    };

    const success = await updateProfile(
      profileUpdatePayload,
      session.user.email
    );

    if (success) {
      setSubmissionMessage({ type: 'success', text: 'Profile updated successfully!' });

      // ← REFRESH SESSION TO PREVENT MIDDLEWARE ISSUES
      try {
        await updateSession();
        console.log('Session refreshed after profile update');
      } catch (error) {
        console.warn('Failed to refresh session:', error);
      }
    }

    setIsSubmitting(false);
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && storeIsLoading && !storeProfile)) {
    return <div className="max-w-md mx-auto p-6 text-center">Loading profile...</div>;
  }

  if (sessionStatus === 'unauthenticated') {
    return <div className="max-w-md mx-auto p-6 text-center">Please sign in to access this page.</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <button
          type="submit"
          disabled={isSubmitting || storeIsLoading}
          className="w-full p-3 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isSubmitting || storeIsLoading ? 'Saving...' : 'Save Profile'}
        </button>

        {/* Display submission message */}
        {submissionMessage && (
          <div
            className={`p-3 mt-4 rounded-md text-sm ${
              submissionMessage.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {submissionMessage.text}
          </div>
        )}

        {/* Display general store error */}
        {storeError && !submissionMessage && (
          <div className="p-3 mt-4 rounded-md text-sm bg-red-50 text-red-700">
            {storeError}
          </div>
        )}
      </form>
    </div>
  );
}