import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    add: (type: ToastType, message: string, duration?: number) => void;
    remove: (id: string) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    add: (type, message, duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
            }, duration);
        }
    },

    remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    success: (message, duration) => useToastStore.getState().add('success', message, duration),
    error: (message, duration) => useToastStore.getState().add('error', message, duration),
    warning: (message, duration) => useToastStore.getState().add('warning', message, duration),
    info: (message, duration) => useToastStore.getState().add('info', message, duration),
}));

// Helper export pour appel sans hook (dans les event handlers)
export const toast = {
    success: (message: string, duration?: number) => useToastStore.getState().success(message, duration),
    error: (message: string, duration?: number) => useToastStore.getState().error(message, duration),
    warning: (message: string, duration?: number) => useToastStore.getState().warning(message, duration),
    info: (message: string, duration?: number) => useToastStore.getState().info(message, duration),
};
