import { UserExt } from '@/lib/types'
import { create } from 'zustand'

//Extended User type for settings page
interface UserExtStore {
    ext: UserExt | null
    setExt: (ext: UserExt) => void
    updateExt: (updates: Partial<UserExt>) => void
}

export const useUserExtStore = create<UserExtStore>((set) => ({
    ext: null,
    setExt: (ext) => set({ ext }),
    updateExt: (updates: Partial<UserExt>) =>
        set((state) => {
            const merged = { ...(state.ext ?? {}), ...updates }
            return { ext: Object.keys(merged).length ? (merged as UserExt) : null }
        }),
}))