namespace SchoolERP.Domain.Enums;

public enum Gender { Male, Female, Other }

public enum SchoolType { Public, Private, Confessional, International, Health }

public enum EnrollmentStatus { Active, Promoted, Repeated, Withdrawn, Transferred }

public enum ExamType { Continuous, Midterm, Final }

public enum EmployeeType { Teacher, Administrative, Support, Director, Censeur, SurveillantGeneral, DirecteurDesEtudes }

public enum ContractType { CDI, CDD, Temporary, Intern }

public enum ContractStatus { Active, Expired, Terminated, Suspended }

public enum LeaveType { Annual, Sick, Maternity, Paternity, Unpaid, Other }

public enum LeaveStatus { Pending, Approved, Rejected, Cancelled }

public enum PayslipStatus { Draft, Finalized }

public enum PayrollRunStatus { Draft, Processing, Finalized }

public enum InvoiceStatus { Unpaid, PartiallyPaid, Paid, Cancelled }

public enum FeeType { Tuition, Registration, Canteen, Transport, Material, Other }

public enum SalaryElementType { Allowance, Deduction }

public enum UserRole
{
    SuperAdmin,     // Full access to all schools
    SchoolAdmin,    // Full access to one school
    HR_Manager,     // Access to HR and Payroll
    Accountant,     // Access to Payroll only
    Teacher,        // Access to grades and schedules
    Student,        // Access to own data only
    Censeur,        // Specific to French-speaking/Malian systems (Secondary)
    Surveillant     // For attendance and discipline
}
