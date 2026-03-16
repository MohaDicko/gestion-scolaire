import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface Contract {
    id: string;
    employeeId: string;
    employeeName: string;
    contractType: string;
    position: string;
    startDate: string;
    endDate: string | null;
    baseSalary: number;
    status: string;
}

export function useContracts() {
    return useQuery<Contract[]>({
        queryKey: ['contracts'],
        queryFn: async () => {
            const { data } = await apiClient.get('/hr/contracts');
            return data;
        }
    });
}

export function useCreateContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (contract: any) => {
            const { data } = await apiClient.post('/hr/contracts', contract);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        }
    });
}
