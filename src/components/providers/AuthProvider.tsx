// src/components/providers/AuthProvider.tsx (Modified)
'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import React, { useEffect } from 'react';
import { useProfileStore } from '@/stores/useProfileStore'; // Ensure this path is correct

interface AuthProviderProps {
  children: React.ReactNode;
}

// Internal component to handle the profile fetching logic
function ProfileDataInitializer() {
  const { data: session, status } = useSession(); // Get session status and data
  const {
    profile: storeProfile,
    isLoading: storeIsLoading,
    fetchUserProfile,
  } = useProfileStore(); // Access Zustand store

  useEffect(() => {
    // Conditions to fetch profile:
    // 1. Session status is 'authenticated'.
    // 2. session.user.email exists (critical for the API call).
    // 3. The profile is not already loaded in the store (storeProfile is null or undefined).
    // 4. The store is not currently in a loading state (to prevent multiple fetches).
    if (
      status === 'authenticated' &&
      session.user.email &&
      !storeProfile &&
      !storeIsLoading
    ) {
      // console.log('ProfileDataInitializer: Triggering fetchUserProfile for', session.user.email);
      fetchUserProfile(session.user.email);
    }
  }, [status, session, storeProfile, storeIsLoading, fetchUserProfile]);

  return null; // This component does not render any UI itself
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <ProfileDataInitializer /> {/* Include the initializer component */}
      {children}
    </SessionProvider>
  );
}