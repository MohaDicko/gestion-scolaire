import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface PayrollRun {
    id: string;
    month: number;
    year: number;
    totalAmount: number;
    payslipCount: number;
    status: string;
    processedAt: string;
    processedBy: string;
}

export interface Payslip {
    id: string;
    payrollRunId: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
    periodMonth: number;
    periodYear: number;
    baseSalary: number;
    netSalary: number;
    grossAmount: number;
    totalDeductions: number;
    status: string;
    generatedAt: string;
    lines: Array<{
        label: string;
        elementType: 'Allowance' | 'Deduction';
        amount: number;
    }>;
}

export function usePayrollRuns() {
    return useQuery<PayrollRun[]>({
        queryKey: ['payrollRuns'],
        queryFn: async () => {
            const { data } = await apiClient.get('/payroll/runs');
            return data;
        }
    });
}

export function useGeneratePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { month: number; year: number }) => {
            const { data } = await apiClient.post('/payroll/runs/generate', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
        }
    });
}

export function usePayslipsByRun(runId: string) {
    return useQuery<Payslip[]>({
        queryKey: ['payslips', runId],
        queryFn: async () => {
            if (!runId) return [];
            const { data } = await apiClient.get(`/payroll/runs/${runId}/payslips`);
            return data;
        },
        enabled: !!runId
    });
}
