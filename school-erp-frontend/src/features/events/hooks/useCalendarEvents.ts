import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface SchoolEventDto {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    categoryId: number;
    categoryName: string;
    isAllDay: boolean;
    location?: string;
}

export interface CreateEventPayload {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    categoryId: number;
    isAllDay: boolean;
    location?: string;
}

export function useCalendarEvents(year: number, month: number) {
    return useQuery<SchoolEventDto[]>({
        queryKey: ['events', year, month],
        queryFn: async () => {
            const { data } = await apiClient.get(`/events?year=${year}&month=${month}`);
            return data;
        }
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateEventPayload) => {
            const { data } = await apiClient.post('/events', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/events/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });
}
