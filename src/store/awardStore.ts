import { create } from 'zustand';
import { Award } from '@/lib/types';

interface AwardStore {
  awards: Award[];
  hasLoaded: boolean;
  setAwards: (awards: Award[]) => void;
  addAward: (award: Award) => void;
  updateAward: (award: Award) => void;
  deleteAward: (id: string) => void;
  setHasLoaded: (loaded: boolean) => void;
}

export const useAwardStore = create<AwardStore>((set) => ({
  awards: [],
  hasLoaded: false,
  setAwards: (awards) => set({ awards }),
  addAward: (award) => set((state) => ({ awards: [...state.awards, award] })),
  updateAward: (award) =>
    set((state) => ({
      awards: state.awards.map((a) => (a.id === award.id ? award : a)),
    })),
  deleteAward: (id) =>
    set((state) => ({
      awards: state.awards.filter((a) => a.id !== id),
    })),
  setHasLoaded: (hasLoaded) => set({ hasLoaded }),
}));