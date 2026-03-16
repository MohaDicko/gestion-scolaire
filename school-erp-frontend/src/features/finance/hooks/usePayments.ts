import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface PaymentDto {
    id: string;
    invoiceNumber: string;
    studentName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber: string;
}

export function usePayments() {
    return useQuery<PaymentDto[]>({
        queryKey: ['payments'],
        queryFn: async () => {
            const { data } = await apiClient.get('/finance/payments');
            return data;
        }
    });
}
