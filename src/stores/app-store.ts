// src/stores/app-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Import actions and types
import { getBankDetails, type BankInfo } from '@/lib/actions/payments-info';
import { getCurrentAcademicSession, type CurrentSessionInfo } from '@/lib/actions/session-actions';
import { getActiveFeeSchedule, type FeeInfo } from '@/lib/actions/fees-actions';
import { getUniversitySettings, type UniversitySettingsMap } from '@/lib/actions/settings-actions';

interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  universitySettings: UniversitySettingsMap | null;
  bankDetails: BankInfo[];
  currentSession: CurrentSessionInfo | null;
  activeFees: FeeInfo[];
  initializeAppState: () => Promise<void>;
  // STEP 1: Define the new function in the interface
  calculateTotalCompulsoryDues: () => number; 
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    // ... (all the initial state properties remain the same)
    isInitialized: false,
    isLoading: false,
    error: null,
    universitySettings: null,
    bankDetails: [],
    currentSession: null,
    activeFees: [],

    // ... (initializeAppState function remains the same)
    initializeAppState: async () => {
      // ... (no changes to this function's body)
      if (get().isInitialized || get().isLoading) return;
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const [settingsResult, bankResult, sessionResult, feesResult] = await Promise.all([
          getUniversitySettings(), getBankDetails(), getCurrentAcademicSession(), getActiveFeeSchedule(),
        ]);
        const combinedError = [settingsResult.error, bankResult.error, sessionResult.error, feesResult.error].filter(Boolean).join('; ');
        if (combinedError) throw new Error(combinedError);
        set((state) => {
          state.universitySettings = settingsResult.data || null;
          state.bankDetails = bankResult.data || [];
          state.currentSession = sessionResult.data || null;
          state.activeFees = feesResult.data || [];
          state.isInitialized = true;
        });
      } catch (error) {
        set((state) => { state.error = error instanceof Error ? error.message : 'An unknown error occurred'; });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    // STEP 2: Implement the calculation function
    calculateTotalCompulsoryDues: () => {
      // Use get() to access the current state within an action
      const { activeFees } = get();

      if (!activeFees || activeFees.length === 0) {
        return 0;
      }

      const total = activeFees
        // 1. Filter for compulsory fees only
        .filter(fee => !fee.is_optional)
        // 2. Map each fee to its calculated annual cost and sum them up with reduce
        .reduce((accumulator, fee) => {
          let feeCost = 0;
          // Ensure amount is a valid number
          const amount = typeof fee.amount === 'number' ? fee.amount : parseFloat(fee.amount as any || '0');

          // 3. Apply frequency logic
          if (fee.frequency === 'per_semester') {
            feeCost = amount * 2;
          } else {
            // Treat 'annual', 'once_on_registration', or null/undefined as a one-time fee
            feeCost = amount;
          }
          
          return accumulator + feeCost;
        }, 0); // Start the accumulator at 0

      return total;
    },
  }))
);