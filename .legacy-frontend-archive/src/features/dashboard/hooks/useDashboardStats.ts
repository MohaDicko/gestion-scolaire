import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface DashboardStats {
    totalStudents: number;
    totalEmployees: number;
    totalClassrooms: number;
    totalPayslips: number;
    totalArrearsAmount: number;
    studentsWithArrearsCount: number;
    studentsBySpecialty: { name: string, count: number }[];
    recentRevenue: { month: string, amount: number }[];
}

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: async (): Promise<DashboardStats> => {
            const { data } = await apiClient.get('/dashboard/stats');
            return data;
        }
    });
}
