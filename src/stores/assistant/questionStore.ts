import { create } from 'zustand';

interface QuestionStore {
  questions: string;
  error: string;
  setQuestions: (questions: string) => void;
  setError: (error: string) => void;
  clear: () => void;
}

export const useQuestionStore = create<QuestionStore>((set) => ({
  questions: '',
  error: '',
  setQuestions: (questions) => set({ questions }),
  setError: (error) => set({ error }),
  clear: () => set({ questions: '', error: '' }),
}));