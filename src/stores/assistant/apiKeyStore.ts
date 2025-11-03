import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeyStore {
  storedApiKey: string;
  setStoredApiKey: (apiKey: string) => void;
  clearStoredApiKey: () => void; // Added
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      storedApiKey: '',
      setStoredApiKey: (apiKey: string) => set({ storedApiKey: apiKey }),
      clearStoredApiKey: () => set({ storedApiKey: '' }), // Reset to empty string
    }),
    {
      name: 'api-key-storage',
    }
  )
);