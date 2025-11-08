import { create } from 'zustand';
import { Experience } from '@/lib/types';

interface ExperienceStore {
  experiences: Experience[];
  hasLoaded: boolean;
  setExperiences: (experiences: Experience[]) => void;
  addExperience: (experience: Experience) => void;
  updateExperience: (experience: Experience) => void;
  deleteExperience: (id: string) => void;
  setHasLoaded: (loaded: boolean) => void;
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  experiences: [],
  hasLoaded: false,
  setExperiences: (experiences) => set({ experiences }),
  addExperience: (experience) =>
    set((state) => ({ experiences: [...state.experiences, experience] })),
  updateExperience: (experience) =>
    set((state) => ({
      experiences: state.experiences.map((e) =>
        e.id === experience.id ? experience : e
      ),
    })),
  deleteExperience: (id) =>
    set((state) => ({
      experiences: state.experiences.filter((e) => e.id !== id),
    })),
  setHasLoaded: (hasLoaded) => set({ hasLoaded }),
}));
