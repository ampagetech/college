import { create } from 'zustand';

interface VideoStore {
  videos: string;
  error: string;
  setVideos: (videos: string) => void;
  setError: (error: string) => void;
  clear: () => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  videos: '',
  error: '',
  setVideos: (videos) => set({ videos }),
  setError: (error) => set({ error }),
  clear: () => set({ videos: '', error: '' }),
}));