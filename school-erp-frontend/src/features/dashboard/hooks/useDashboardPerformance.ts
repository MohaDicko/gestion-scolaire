import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface PerformanceData {
    month: string;
    revenue: number;
    expenses: number;
}

export function useDashboardPerformance() {
    return useQuery({
        queryKey: ['dashboard', 'performance'],
        queryFn: async (): Promise<PerformanceData[]> => {
            const { data } = await apiClient.get('/dashboard/performance');
            return data;
        }
    });
}
