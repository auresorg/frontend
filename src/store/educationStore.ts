import { Education } from '@/lib/types';
import { create } from 'zustand';

interface EducationStore {
    //there can only be one education entry per user
    education: Education | null;
    hasLoaded: boolean;
    setHasLoaded: (loaded: boolean) => void;
    setEducation: (education: Education) => void;
    updateEducation: (updates: Partial<Education>) => void;
    getEducation: () => Education | null;
}

export const useEducationStore = create<EducationStore>((set, get) => ({
    education: null,
    hasLoaded: false,
    setHasLoaded: (hasLoaded) => set({ hasLoaded }),
    setEducation: (education) => set({ education }),
    updateEducation: (updates) =>  
        set((state) => ({
            education: state.education ? { ...state.education, ...updates } : null,
        })),
    getEducation: () => get().education,
}));