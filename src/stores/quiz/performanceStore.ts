// store/performanceStore.ts
import { create } from 'zustand';

interface PerformanceData {
  date: string;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface PerformanceState {
  data: PerformanceData[];
  graphType: 'line' | 'bar';
  setData: (data: PerformanceData[]) => void;
  setGraphType: (type: 'line' | 'bar') => void;
  clearData: () => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  data: [],
  graphType: 'line', // Default to line graph
  setData: (data) => set({ data }),
  setGraphType: (graphType) => set({ graphType }),
  clearData: () => set({ data: [] }),
}));