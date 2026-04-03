import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export interface Subject {
    id: string;
    name: string;
    code: string;
    coefficient: number;
}

export interface GradeEntry {
    studentId: string;
    score: number;
    comment: string | null;
}

export interface SubmitGradesCommand {
    subjectId: string;
    academicYearId: string;
    semester: number;
    examType: number; // 0: Continuous, 1: Midterm, 2: Final
    maxScore: number;
    grades: GradeEntry[];
}

export interface GradeDto {
    id: string;
    studentId: string;
    studentName: string;
    studentNumber: string;
    score: number;
    maxScore: number;
    comment: string | null;
}

export function useSubjects() {
    return useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const { data } = await apiClient.get<Subject[]>('/academic/subjects');
            return data;
        }
    });
}

export function useGrades(
    classroomId: string,
    subjectId: string,
    academicYearId: string,
    semester: number,
    examType: number
) {
    return useQuery({
        queryKey: ['grades', classroomId, subjectId, academicYearId, semester, examType],
        queryFn: async () => {
            if (!classroomId || !subjectId || !academicYearId) return [];
            const { data } = await apiClient.get<GradeDto[]>('/academic/grades', {
                params: {
                    classroomId,
                    subjectId,
                    academicYearId,
                    semester,
                    examType
                }
            });
            return data;
        },
        enabled: !!classroomId && !!subjectId && !!academicYearId
    });
}

export function useSubmitGrades() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (command: SubmitGradesCommand) => {
            const { data } = await apiClient.post('/academic/grades/bulk', command);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
        }
    });
}

export interface StudentBulletin {
    studentName: string;
    className: string;
    academicYear: string;
    period: number;
    totalPoints: number;
    totalCoefficients: number;
    periodAverage: number;
    rank: string;
    attendance: {
        present: number;
        absent: number;
        late: number;
        excused: number;
    };
    subjects: Array<{
        subjectName: string;
        classAverage: number;
        examScore: number;
        coefficient: number;
        finalAverage: number;
        points: number;
        appreciation: string;
    }>;
}

export function useStudentBulletin(studentId: string, period: number) {
    return useQuery({
        queryKey: ['bulletin', studentId, period],
        queryFn: async () => {
            if (!studentId) return null;
            const { data } = await apiClient.get<StudentBulletin>(`/academic/students/${studentId}/bulletin`, {
                params: { semester: period }
            });
            return data;
        },
        enabled: !!studentId
    });
}
