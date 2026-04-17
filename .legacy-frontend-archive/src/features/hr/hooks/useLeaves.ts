import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
}

export function useLeaves() {
    return useQuery<LeaveRequest[]>({
        queryKey: ['leaves'],
        queryFn: async () => {
            const { data } = await apiClient.get('/hr/leaves');
            return data;
        }
    });
}

export function useCreateLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { employeeId: string; leaveType: number; startDate: string; endDate: string; reason: string }) => {
            const { data } = await apiClient.post('/hr/leaves', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] });
        }
    });
}

export function useUpdateLeaveStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, isApproved, rejectionReason }: { id: string; isApproved: boolean; rejectionReason?: string }) => {
            await apiClient.put(`/hr/leaves/${id}/status`, { leaveRequestId: id, isApproved, rejectionReason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] });
        }
    });
}
