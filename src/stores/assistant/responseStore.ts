// src/store/responseStore.ts
import { create } from 'zustand';

interface ResponseStore {
  response: string;
  error: string;
  prompt: string;
  setResponse: (response: string) => void;
  setError: (error: string) => void;
  setPrompt: (prompt: string) => void;
  clear: () => void;
}

export const useResponseStore = create<ResponseStore>((set) => ({
  response: '',
  error: '',
  prompt: '',
  setResponse: (response: string) => set({ response }),
  setError: (error: string) => set({ error }),
  setPrompt: (prompt: string) => set({ prompt }),
  clear: () => set({ response: '', error: '', prompt: '' }),
}));