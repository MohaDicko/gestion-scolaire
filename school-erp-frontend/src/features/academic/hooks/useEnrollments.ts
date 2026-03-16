import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    studentNumber: string;
    classroomId: string;
    classroomName: string;
    academicYearName: string;
    status: string;
    enrollmentDate: string;
}

export function useEnrollments(filters: { classroomId?: string; academicYearId?: string } = {}) {
    const queryClient = useQueryClient();

    const enrollmentsQuery = useQuery({
        queryKey: ['enrollments', filters],
        queryFn: async () => {
            const { data } = await apiClient.get<Enrollment[]>('/academic/enrollments', { params: filters });
            return data;
        }
    });

    const enrollStudent = useMutation({
        mutationFn: async (enrollment: { studentId: string; classroomId: string; academicYearId: string }) => {
            const { data } = await apiClient.post('/academic/enrollments', enrollment);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrollments'] });
            queryClient.invalidateQueries({ queryKey: ['classrooms'] }); // Update counts
        }
    });

    const transferStudent = useMutation({
        mutationFn: async (transfer: { studentId: string; newClassroomId: string; academicYearId: string }) => {
            await apiClient.post('/academic/enrollments/transfer', transfer);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrollments'] });
            queryClient.invalidateQueries({ queryKey: ['classrooms'] });
        }
    });

    return {
        enrollments: enrollmentsQuery.data ?? [],
        isLoading: enrollmentsQuery.isLoading,
        error: enrollmentsQuery.error,
        enrollStudent,
        transferStudent
    };
}
