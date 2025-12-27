import { create } from 'zustand';
import { ResumeItem } from '@/lib/types';

interface ResumeStore {
    resumes: ResumeItem[];
    hasLoaded: boolean;
    setResumes: (resumes: ResumeItem[]) => void;
    setHasLoaded: (loaded: boolean) => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
    resumes: [],
    hasLoaded: false,
    setResumes: (resumes) => set({ resumes }),
    setHasLoaded: (hasLoaded) => set({ hasLoaded }),
}));