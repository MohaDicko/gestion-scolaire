import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    email: string;
    phoneNumber: string;
    employeeType: string;
    departmentName: string | null;
    campusName: string | null;
    isActive: boolean;
    photoUrl?: string;
}

interface PaginatedResponse {
    items: Employee[];
    totalCount: number;
    pageNumber: number;
    totalPages: number;
}

export function useEmployees(params: { pageNumber?: number; pageSize?: number; search?: string; departmentId?: string } = {}) {
    return useQuery<PaginatedResponse>({
        queryKey: ['employees', params],
        queryFn: async () => {
            const { data } = await apiClient.get('/hr/employees', { params });
            return data;
        }
    });
}

export function useCreateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (employee: any) => {
            const { data } = await apiClient.post('/hr/employees', employee);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
    });
}

export function useActivateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.post(`/hr/employees/${id}/activate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
    });
}

export function useDeactivateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.post(`/hr/employees/${id}/deactivate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
    });
}
