import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export interface NotificationDto {
    id: string;
    title: string;
    body: string;
    type: number;
    typeName: string;
    isRead: boolean;
    linkUrl?: string;
    createdAt: string;
}

export function useNotifications() {
    return useQuery<NotificationDto[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await apiClient.get('/notifications');
            return data;
        },
        refetchInterval: 30000, // Poll every 30s
    });
}

export function useMarkRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.put(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
}

export function useSendNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { title: string; body: string; typeId: number; recipientUserId?: string; linkUrl?: string }) => {
            const { data } = await apiClient.post('/notifications', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
}
