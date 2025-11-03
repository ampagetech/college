// src/stores/assistant/filterStore.ts

import { create } from 'zustand';
// Step 1: Import the new Server Action and its associated Type
import { getTopics, type Topic } from '@/lib/actions/topicsActions';

// Interface for the state managed by the store
interface FilterState {
  level: string;
  term: string;
  week: string; // This field exists in your state, so we'll keep it
  subject: string;
  topic: string;
  topics: Topic[]; // Uses the imported Topic type
  missingFilters: string[];
  error: string;
}

// Interface for the actions that can be performed on the store
interface FilterActions {
  setFilters: (filters: Partial<FilterState>) => void;
  fetchTopics: (level: string, term: string, subject: string) => Promise<void>;
  validateFilters: () => void;
  reset: () => void;
}

// Defines the initial, clean state for the store
const initialState: FilterState = {
  level: '',
  term: '',
  week: '',
  subject: '',
  topic: '',
  topics: [],
  missingFilters: [],
  error: '',
};

// Create the Zustand store
export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  // Initialize the store with the initial state
  ...initialState,

  /**
   * A generic action to update one or more filter properties in the state.
   * @param filters - An object with the state properties to update.
   */
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),

  /**
   * Fetches topics from the server using the getTopics Server Action.
   * It handles setting loading states implicitly and updates topics or errors.
   */
  fetchTopics: async (level, term, subject) => {
    // Clear any previous topics and error messages before a new fetch
    set({ error: '', topics: [] });

    // Guard clause to prevent unnecessary API calls
    if (!level || !term || !subject) return;

    // Step 2: Call the Server Action directly instead of using fetch()
    const { data, error } = await getTopics(level, term, subject);

    // Step 3: Handle the response from the Server Action
    if (error) {
      // If the action returned an error, update the error state
      set({
        error: error, // Set the error message from the server
        topics: [],   // Ensure topics array is empty
      });
    } else {
      // If the action was successful, update the topics state
      // Use `data || []` as a safety net in case data is null/undefined
      set({ topics: data || [] });
    }
  },

  /**
   * Validates that all required filters have been selected by the user.
   * Updates the `missingFilters` array which can be used to show an alert in the UI.
   */
  validateFilters: () =>
    set((state) => {
      const missing: string[] = [];
      if (!state.level) missing.push('Level');
      if (!state.term) missing.push('Term');
      if (!state.subject) missing.push('Subject');
      if (!state.topic) missing.push('Topic');
      return { missingFilters: missing };
    }),

  /**
   * Resets the entire store back to its initial state.
   */
  reset: () => set(initialState),
}));