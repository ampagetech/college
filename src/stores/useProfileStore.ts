// Global state management for user profile.
// src/stores/useProfileStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer'; // Optional: for easier immutable updates

// Types for the store
export interface UserProfile {
  firstName: string;
  lastName: string;
  classValue: string; // Renamed from 'class' to avoid JS keyword conflict
  userEmail: string; // The logged-in user's email
  tenantId: string | null;
  associatedTenantName: string | null; // Name of the tenant user is associated with
  associatedTenantEmail: string | null; // Email of the tenant user is associated with
}

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchUserProfile: (userEmail: string) => Promise<void>;
  updateProfile: (
    data: {
      firstName: string;
      lastName: string;
      classValue: string;
      tenantId: string | null;
    },
    userEmail: string
  ) => Promise<boolean>; // Returns true on success, false on failure
}

export const useProfileStore = create<ProfileState>()(
  immer((set, get) => ({
    profile: null,
    isLoading: false,
    error: null,

    fetchUserProfile: async (userEmail) => {
      if (!userEmail) {
        set((state) => {
          state.error = 'User email not provided for fetching profile.';
          state.profile = null;
        });
        return;
      }
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        // NOTE: We are creating /api/profile/me, but the old page used /api/profile?email=...
        // For initial load, we'll use the new /api/profile/me which doesn't need email in query
        const response = await fetch('/api/profile/me');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user profile');
        }
        const data: UserProfile = await response.json();
        set((state) => {
          state.profile = data;
          state.isLoading = false;
        });
      } catch (error) {
        console.error('Fetch profile error:', error);
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'An unknown error occurred';
          state.profile = null;
        });
      }
    },

    updateProfile: async (updateData, userEmail) => {
      if (!userEmail) {
        set((state) => {
          state.error = 'User email not provided for updating profile.';
        });
        return false;
      }
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const response = await fetch('/api/profile/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: updateData.firstName,
            last_name: updateData.lastName,
            class: updateData.classValue, // Ensure this matches the backend expected field name
            tenant_id: updateData.tenantId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update profile');
        }
        
        // For tenantName and tenantEmail, we'd ideally get them back from the server
        // or re-fetch, or if tenantId is now null, clear them.
        // For simplicity here, we'll update the basic fields.
        // A full re-fetch might be more robust for tenant name/email changes.
        
        set((state) => {
            state.isLoading = false;
            // Optimistically update profile or re-fetch
            if (state.profile) {
                state.profile.firstName = updateData.firstName;
                state.profile.lastName = updateData.lastName;
                state.profile.classValue = updateData.classValue;
                state.profile.tenantId = updateData.tenantId;
                // If tenantId is now null, clear associated tenant info
                if (updateData.tenantId === null) {
                    state.profile.associatedTenantName = null;
                    state.profile.associatedTenantEmail = null;
                } else {
                    // If tenantId changed, we don't know the new name/email without another fetch
                    // This part might need refinement or a re-fetch strategy
                    // For now, we assume if tenantId is set, name/email were handled during verification step.
                }
            }
        });
        // Trigger a re-fetch to get the most accurate tenant name/email if tenant_id changed
        await get().fetchUserProfile(userEmail);
        return true;
      } catch (error) {
        console.error('Update profile error:', error);
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'An unknown error occurred';
        });
        return false;
      }
    },
  }))
);