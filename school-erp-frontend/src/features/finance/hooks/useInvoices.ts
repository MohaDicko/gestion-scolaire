import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    description: string;
    amount: number;
    remainingAmount: number;
    status: string;
    dueDate: string;
    studentName?: string;
}

export function useInvoices() {
    return useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const { data } = await apiClient.get<Invoice[]>('/finance/invoices');
            return data;
        }
    });
}

export function useGenerateClassInvoices() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ classroomId, ...payload }: any) => {
            const { data } = await apiClient.post(`/finance/classrooms/${classroomId}/invoices`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
    });
}

export function usePayInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ invoiceId, amount, paymentMethod, referenceNumber }: any) => {
            const { data } = await apiClient.post(`/finance/invoices/${invoiceId}/pay`, {
                amount,
                paymentMethod,
                referenceNumber
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
    });
}
