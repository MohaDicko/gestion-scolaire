import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface StudentDashboardDto {
    studentId: string;
    fullName: string;
    studentNumber: string;
    className: string;
    academicYear: string;
    averageGrade: number | null;
    totalAbsences: number;
    totalLate: number;
    totalDue: number;
    totalPaid: number;
    totalOutstanding: number;
    grades: SubjectGradeSummary[];
    recentAttendance: AttendanceSummaryItem[];
    invoices: StudentInvoiceSummary[];
    todaySchedule: ScheduleSummary[];
    sanctions: SanctionSummary[];
    maxSectionGrade: number;
}

export interface SanctionSummary {
    id: string;
    type: string;
    reason: string;
    date: string;
    durationDays?: number;
}

export interface SubjectGradeSummary {
    subjectName: string;
    average: number;
    maxScore: number;
}

export interface AttendanceSummaryItem {
    date: string;
    status: string;
    remarks?: string;
}

export interface StudentInvoiceSummary {
    invoiceId: string;
    description: string;
    amount: number;
    amountPaid: number;
    status: string;
    dueDate: string;
}

export interface ScheduleSummary {
    startTime: string;
    endTime: string;
    subjectName: string;
    teacherName: string;
}

export function useStudentPortal(studentId: string) {
    return useQuery<StudentDashboardDto>({
        queryKey: ['student-portal', studentId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/academic/students/${studentId}/portal`);
            return data;
        },
        enabled: !!studentId
    });
}

export function useAddSanction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sanction: any) => {
            const { studentId } = sanction;
            await apiClient.post(`/academic/students/${studentId}/sanctions`, sanction);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['student-portal', variables.studentId] });
        }
    });
}
