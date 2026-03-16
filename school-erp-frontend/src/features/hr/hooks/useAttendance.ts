import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export enum StaffAttendanceStatus {
    Present = 0,
    Absent = 1,
    Late = 2,
    OnLeave = 3,
    Excused = 4
}

export interface StaffAttendance {
    employeeId: string;
    employeeName: string;
    status: StaffAttendanceStatus;
    remarks: string;
    checkIn?: string;
    checkOut?: string;
}

export function useStaffAttendance(date: string) {
    const queryClient = useQueryClient();

    const attendanceQuery = useQuery({
        queryKey: ['staff-attendance', date],
        queryFn: async () => {
            const { data } = await apiClient.get<StaffAttendance[]>('/hr/attendance', { params: { date } });
            return data;
        },
        enabled: !!date
    });

    const recordAttendance = useMutation({
        mutationFn: async (payload: { date: string; entries: StaffAttendance[] }) => {
            await apiClient.post('/hr/attendance', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-attendance', date] });
        }
    });

    return {
        attendance: attendanceQuery.data ?? [],
        isLoading: attendanceQuery.isLoading,
        recordAttendance
    };
}
