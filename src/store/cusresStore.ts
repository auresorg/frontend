import { create } from 'zustand';
import { Cusres } from '@/lib/types';

interface CusresStore {
  cusres: Cusres[];
  hasLoaded: boolean;
  setCusres: (cusres: Cusres[]) => void;
  addCusres: (cusres: Cusres) => void;
  deleteCusres: (id: string) => void;
  setHasLoaded: (loaded: boolean) => void;
}

export const useCusresStore = create<CusresStore>((set) => ({
  cusres: [],
  hasLoaded: false,
  setCusres: (cusres) => set({ cusres }),
  addCusres: (cusres) => set((state) => ({ cusres: [...state.cusres, cusres] })),
  deleteCusres: (id) =>
    set((state) => ({
      cusres: state.cusres.filter((c) => c.id !== id),
    })),
  setHasLoaded: (hasLoaded) => set({ hasLoaded }),
}));