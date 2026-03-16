import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface ExpenseDto {
    id: string;
    description: string;
    amount: number;
    dateIncurred: string;
    categoryId: number;
    categoryName: string;
    referenceNumber?: string;
}

export interface RecordExpensePayload {
    description: string;
    amount: number;
    dateIncurred: string;
    categoryId: number;
    referenceNumber?: string;
}

export function useExpenses() {
    return useQuery<ExpenseDto[]>({
        queryKey: ['expenses'],
        queryFn: async () => {
            const { data } = await apiClient.get('/finance/expenses');
            return data;
        }
    });
}

export function useRecordExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: RecordExpensePayload) => {
            const { data } = await apiClient.post('/finance/expenses', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
    });
}
