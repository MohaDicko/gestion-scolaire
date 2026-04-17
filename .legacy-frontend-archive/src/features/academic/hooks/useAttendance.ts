import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface AttendanceDto {
    studentId: string;
    studentName: string;
    rollNumber: string;
    status: number; // 0=Present, 1=Absent, 2=Late, 3=Excused
    remarks: string;
}

export function useClassAttendance(classroomId: string, date: string) {
    return useQuery<AttendanceDto[]>({
        queryKey: ['attendance', classroomId, date],
        queryFn: async () => {
            if (!classroomId) return [];
            const { data } = await apiClient.get(`/academic/classrooms/${classroomId}/attendance`, {
                params: { date }
            });
            return data;
        },
        enabled: !!classroomId && !!date
    });
}

export function useRecordAttendance(classroomId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { classroomId: string; date: string; attendances: { studentId: string; status: number; remarks: string }[] }) => {
            await apiClient.post(`/academic/classrooms/${classroomId}/attendance`, payload);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attendance', variables.classroomId, variables.date] });
        }
    });
}
