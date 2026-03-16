// ── Common Types ───────────────────────────────────────────────

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

// ── Academic Types ─────────────────────────────────────────────

export type Gender = 'Male' | 'Female' | 'Other';
export type EnrollmentStatus = 'Active' | 'Promoted' | 'Repeated' | 'Withdrawn' | 'Transferred';
export type ExamType = 'Continuous' | 'Midterm' | 'Final';

export interface Student {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    gender: Gender;
    photoUrl?: string;
    nationalId: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    parentRelationship: string;
    isActive: boolean;
    classroomName?: string;
    createdAt: string;
}

export interface Classroom {
    id: string;
    name: string;
    level: string;
    maxCapacity: number;
    academicYearId: string;
    enrollmentCount: number;
}

export interface AcademicYear {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
}

export interface Enrollment {
    id: string;
    studentId: string;
    student?: Student;
    classroomId: string;
    classroom?: Classroom;
    academicYearId: string;
    status: EnrollmentStatus;
    enrollmentDate: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    coefficient: number;
}

export interface Grade {
    id: string;
    studentId: string;
    student?: Student;
    subjectId: string;
    subject?: Subject;
    score: number;
    maxScore: number;
    semester: 1 | 2;
    examType: ExamType;
    comment?: string;
    createdAt: string;
    createdBy: string;
}

// ── HR Types ───────────────────────────────────────────────────

export type EmployeeType = 'Teacher' | 'Administrative' | 'Support' | 'Director';
export type ContractType = 'CDI' | 'CDD' | 'Temporary' | 'Intern';
export type ContractStatus = 'Active' | 'Expired' | 'Terminated' | 'Suspended';
export type LeaveType = 'Annual' | 'Sick' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Other';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
}

export interface Employee {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: Gender;
    hireDate: string;
    employeeType: EmployeeType;
    photoUrl?: string;
    isActive: boolean;
    departmentId: string;
    department?: Department;
    departmentName?: string;
}

export interface Contract {
    id: string;
    employeeId: string;
    employee?: Employee;
    contractType: ContractType;
    startDate: string;
    endDate?: string;
    baseSalary: number;
    currency: string;
    status: ContractStatus;
    createdAt: string;
    createdBy: string;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employee?: Employee;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: LeaveStatus;
    approvedById?: string;
    approvedAt?: string;
    rejectionReason?: string;
}

// ── Payroll Types ──────────────────────────────────────────────

export type PayslipStatus = 'Draft' | 'Finalized';
export type PayrollRunStatus = 'Draft' | 'Processing' | 'Finalized';
export type SalaryElementType = 'Allowance' | 'Deduction';

export interface PayslipLine {
    id: string;
    label: string;
    elementType: SalaryElementType;
    amount: number;
}

export interface Payslip {
    id: string;
    employeeId: string;
    employee?: Employee;
    payrollRunId: string;
    grossSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
    currency: string;
    month: number;
    year: number;
    status: PayslipStatus;
    lines: PayslipLine[];
    createdAt: string;
}

export interface PayrollRun {
    id: string;
    month: number;
    year: number;
    period: string;
    runDate: string;
    status: PayrollRunStatus;
    payslipCount: number;
}
