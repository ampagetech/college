// Purpose: An invisible component that triggers the data loading process.
'use client';

import { useAppStore } from '@/stores/app-store';
import { useSessionStore } from '@/stores/useSessionStore';
import { useEffect } from 'react';

export default function AppInitializer() {
  const { session, fetchSession } = useSessionStore();
  const { isInitialized, initializeAppState } = useAppStore();

  useEffect(() => {
    if (session === null) {
      fetchSession();
    }
    if (session && !isInitialized) {
      initializeAppState();
    }
  }, [session, isInitialized, fetchSession, initializeAppState]);

  return null;
}