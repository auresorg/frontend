import { User } from '@/lib/types';
import { create } from 'zustand';

interface UserStore {
    user: User | null;
    setUser: (user: User) => void;
    updateUser: (updates: Partial<User>) => void;
    editSkills: (skills: string[], type: string) => void;
    editProjectsCount: (count: number, type: string) => void;
    editCertCount: (count: number, type: string) => void;
    editAwardCount: (count: number, type: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    updateUser: (updates: Partial<User>) =>
        set((state) => {
            const merged = { ...(state.user ?? {}), ...updates };
            return { user: Object.keys(merged).length ? (merged as User) : null };
        }),

    editSkills: (skills: string[], type: string) =>
        set((state) => {
            if (!state.user) return state;

            const newSkills = { ...(state.user.skills ?? {}) };

            if (type === 'remove') {
                skills.forEach((skill) => {
                    if (newSkills[skill]) {
                        newSkills[skill] -= 1;
                        if (newSkills[skill] <= 0) delete newSkills[skill];
                    }
                });
            } else if (type === 'add') {
                skills.forEach((skill) => {
                    newSkills[skill] = (newSkills[skill] || 0) + 1;
                });
            }
            console.log('Updated skills: ', newSkills);
            return {
                user: {
                    ...state.user,
                    skills: newSkills,
                    skillCount: Object.keys(newSkills).length,
                },
            };
        }),

    editProjectsCount: (count: number, type: string) =>
        set((state) => {
            if (!state.user) return state;

            const newProjectsCount = type === 'increment'
                ? state.user.projectsCount + count
                : Math.max(0, state.user.projectsCount - count);

            return {
                user: {
                    ...state.user,
                    projectsCount: newProjectsCount,
                },
            };
        }),

    editCertCount: (count: number, type: string) =>
        set((state) => {
            if (!state.user) return state;
            const newCertCount = type === 'increment'
                ? state.user.certCount + count
                : Math.max(0, state.user.certCount - count);
            return {
                user: {
                    ...state.user,
                    certCount: newCertCount,
                },
            };
        }),

    editAwardCount: (count: number, type: string) =>
        set((state) => {
            if (!state.user) return state;
            const newAwardsCount = type === 'increment'
                ? state.user.awardsCount + count
                : Math.max(0, state.user.awardsCount - count);
            return {
                user: {
                    ...state.user,
                    awardsCount: newAwardsCount,
                },
            };
        })
}));