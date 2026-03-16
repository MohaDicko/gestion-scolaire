import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface Classroom {
    id: string;
    name: string;
    level: string;
    maxCapacity: number;
    studentCount: number;
    academicYearName: string;
}

export interface AcademicYear {
    id: string;
    name: string;
    isCurrent: boolean;
}

export function useClassrooms() {
    const queryClient = useQueryClient();

    // Fetch all classrooms
    const classroomsQuery = useQuery({
        queryKey: ['classrooms'],
        queryFn: async () => {
            const { data } = await apiClient.get<Classroom[]>('/academic/classrooms');
            return data;
        }
    });

    // Create a new classroom
    const createClassroom = useMutation({
        mutationFn: async (newClassroom: { name: string; level: string; maxCapacity: number; academicYearId: string }) => {
            const { data } = await apiClient.post('/academic/classrooms', newClassroom);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classrooms'] });
        }
    });

    // Delete a classroom
    const deleteClassroom = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/academic/classrooms/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classrooms'] });
        }
    });

    return {
        classrooms: classroomsQuery.data ?? [],
        isLoading: classroomsQuery.isLoading,
        error: classroomsQuery.error,
        createClassroom,
        deleteClassroom
    };
}

export function useClassroomById(id: string | null) {
    return useQuery({
        queryKey: ['classrooms', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await apiClient.get<Classroom>(`/academic/classrooms/${id}`);
            return data;
        },
        enabled: !!id
    });
}

export function useAcademicYears() {
    return useQuery({
        queryKey: ['academicYears'],
        queryFn: async () => {
            const { data } = await apiClient.get<AcademicYear[]>('/academic/years');
            return data;
        }
    });
}
