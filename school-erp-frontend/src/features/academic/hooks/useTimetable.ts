import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface ScheduleDto {
    id: string;
    subjectId: string;
    subjectName: string;
    teacherId: string;
    teacherName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export function useClassSchedule(classroomId: string) {
    return useQuery<ScheduleDto[]>({
        queryKey: ['schedule', classroomId],
        queryFn: async () => {
            if (!classroomId) return [];
            const { data } = await apiClient.get(`/academic/classrooms/${classroomId}/schedule`);
            return data;
        },
        enabled: !!classroomId
    });
}

export function useSetClassSchedule(classroomId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { classroomId: string; schedules: any[] }) => {
            await apiClient.post(`/academic/classrooms/${classroomId}/schedule`, payload);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['schedule', variables.classroomId] });
        }
    });
}
