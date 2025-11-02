import { Project } from '@/lib/types';
import { create } from 'zustand';

interface ProjectStore {
    projects: Project[];
    hasLoaded: boolean;
    setHasLoaded: (loaded: boolean) => void;
    setProjects: (projects: Project[]) => void;
    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    getProject: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    hasLoaded: false,
    setHasLoaded: (hasLoaded) => set({ hasLoaded }),
    setProjects: (projects) => set({ projects }),
    addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
    updateProject: (id, updates) =>
        set((state) => ({
            projects: state.projects.map((project) =>
                project.id === id ? { ...project, ...updates } : project
            ),
        })),
    deleteProject: (id) =>
        set((state) => ({
            projects: state.projects.filter((project) => project.id !== id),
        })),
    getProject: (id) => get().projects.find((project) => project.id === id),
}));