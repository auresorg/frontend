import { create } from 'zustand';
import { ResumeItem } from '@/lib/types';

interface ResumeStore {
    resumes: ResumeItem[];
    hasLoaded: boolean;
    setResumes: (resumes: ResumeItem[]) => void;
    setHasLoaded: (loaded: boolean) => void;
    updateResumeTemplate: (role: string, template: string) => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
    resumes: [],
    hasLoaded: false,
    setResumes: (resumes) => set({ resumes }),
    setHasLoaded: (hasLoaded) => set({ hasLoaded }),
    updateResumeTemplate: (role, template) => set((state) => ({
        resumes: state.resumes.map((r) =>
            r.role === role ? { ...r, template } : r
        ),
    })),
}));