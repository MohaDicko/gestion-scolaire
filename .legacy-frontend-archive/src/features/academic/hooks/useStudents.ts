import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { Student, PaginatedResult } from '../../../types';

// ── Query Keys ─────────────────────────────────────────────────
export const studentKeys = {
    all: ['students'] as const,
    lists: () => [...studentKeys.all, 'list'] as const,
    list: (filters: object) => [...studentKeys.lists(), filters] as const,
    details: () => [...studentKeys.all, 'detail'] as const,
    detail: (id: string) => [...studentKeys.details(), id] as const,
};

// ── DTOs ───────────────────────────────────────────────────────
export interface GetStudentsQuery {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    classroomId?: string;
    isActive?: boolean;
}

export interface CreateStudentCommand {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female' | 'Other';
    nationalId: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    parentRelationship: string;
    campusId: string;
}

export interface UpdateStudentCommand {
    firstName: string;
    lastName: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    photoUrl?: string;
}

// ── Hooks ──────────────────────────────────────────────────────

export function useGetStudents(query: GetStudentsQuery = {}) {
    return useQuery({
        queryKey: studentKeys.list(query),
        queryFn: async (): Promise<PaginatedResult<Student>> => {
            const { data } = await apiClient.get('/academic/students', { params: query });
            return data;
        },
    });
}

export function useGetStudent(id: string) {
    return useQuery({
        queryKey: studentKeys.detail(id),
        queryFn: async (): Promise<Student> => {
            const { data } = await apiClient.get(`/academic/students/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (command: CreateStudentCommand): Promise<Student> => {
            const { data } = await apiClient.post('/academic/students', command);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}

export function useUpdateStudent(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (command: UpdateStudentCommand): Promise<Student> => {
            const { data } = await apiClient.put(`/academic/students/${id}`, command);
            return data;
        },
        onSuccess: (updatedStudent) => {
            // Optimistic update — update detail cache immediately
            queryClient.setQueryData(studentKeys.detail(id), updatedStudent);
            // Invalidate list to reflect any search/filter changes
            queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}

export function useDeactivateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await apiClient.delete(`/academic/students/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}
