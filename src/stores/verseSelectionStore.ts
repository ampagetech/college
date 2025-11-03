// src/store/verseSelectionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VerseRange {
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
}

interface VerseSelectionState {
  selectedRange: VerseRange;
  setSelectedRange: (range: VerseRange) => void;
  resetToDefault: () => void;
}

const defaultRange: VerseRange = {
  startChapter: 1,
  startVerse: 1,
  endChapter: 1,
  endVerse: 7
};

export const useVerseSelectionStore = create<VerseSelectionState>()(
  persist(
    (set) => ({
      selectedRange: defaultRange,
      setSelectedRange: (range: VerseRange) => set({ selectedRange: range }),
      resetToDefault: () => set({ selectedRange: defaultRange }),
    }),
    {
      name: 'verse-selection-storage',
    }
  )
);