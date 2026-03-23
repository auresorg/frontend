import { create } from 'zustand';
import { Notification } from '@/lib/types';
import { getWithToken, deleteWithToken } from '@/lib/utils';

interface NotificationStore {
    notifications: Notification[];
    isLoading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    dismissNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await getWithToken('/notifications');
            if (response && response.data) {
                set({ notifications: response.data, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            const message = error instanceof Error ? error.message : String(error);
            set({ error: message, isLoading: false });
        }
    },

    dismissNotification: async (id: number) => {
        // Optimistically remove from state
        const originalNotifications = get().notifications;
        set({ notifications: originalNotifications.filter(n => n.id !== id) });

        try {
            await deleteWithToken(`/notifications/${id}`);
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
            // Revert state if it fails
            const message = error instanceof Error ? error.message : String(error);
            set({ notifications: originalNotifications, error: message });
        }
    }
}));
