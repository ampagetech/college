// src/stores/useSessionStore.ts

// Purpose: Holds the logged-in user's session object.
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
// FIX: The `Session` type is imported from the core 'next-auth' package,
// while client-side functions like `getSession` come from 'next-auth/react'.
import { type Session } from 'next-auth';
import { getSession } from 'next-auth/react';

interface SessionState {
  session: Session | null;
  isLoading: boolean;
  fetchSession: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
  immer((set) => ({
    session: null,
    isLoading: true,
    fetchSession: async () => {
      set((state) => { state.isLoading = true; });
      try {
        const session = await getSession();
        set((state) => { state.session = session; });
      } catch (error) {
        console.error("Failed to fetch session:", error);
        set((state) => { state.session = null; });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },
  }))
);