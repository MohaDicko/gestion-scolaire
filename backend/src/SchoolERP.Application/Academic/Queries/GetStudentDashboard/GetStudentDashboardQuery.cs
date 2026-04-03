using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Application.Academic.Queries.GetStudentDashboard;

public record GetStudentDashboardQuery(Guid StudentId) : IRequest<StudentDashboardDto>;

public record StudentDashboardDto(
    Guid StudentId,
    string FullName,
    string StudentNumber,
    string ClassName,
    string AcademicYear,
    double? AverageGrade,
    int TotalAbsences,
    int TotalLate,
    decimal TotalDue,
    decimal TotalPaid,
    decimal TotalOutstanding,
    List<SubjectGradeSummary> Grades,
    List<AttendanceSummaryItem> RecentAttendance,
    List<StudentInvoiceSummary> Invoices,
    List<ScheduleSummary> TodaySchedule,
    List<SanctionSummary> Sanctions,
    double MaxSectionGrade = 20.0
);

public record SubjectGradeSummary(string SubjectName, double Average, double MaxScore);
public record AttendanceSummaryItem(DateTime Date, string Status, string? Remarks);
public record StudentInvoiceSummary(Guid InvoiceId, string Description, decimal Amount, decimal AmountPaid, string Status, DateTime DueDate);
public record ScheduleSummary(string StartTime, string EndTime, string SubjectName, string TeacherName);
public record SanctionSummary(Guid Id, string Type, string Reason, DateTime Date, int? DurationDays);

public class GetStudentDashboardQueryHandler : IRequestHandler<GetStudentDashboardQuery, StudentDashboardDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStudentDashboardQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StudentDashboardDto> Handle(GetStudentDashboardQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        // Student info
        var student = await db.Set<Student>()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken);

        if (student == null)
            throw new Exception("Student not found");

        // Current enrollment
        var enrollment = await db.Set<Enrollment>()
            .Include(e => e.Classroom)
                .ThenInclude(c => c!.AcademicYear)
            .Include(e => e.Classroom)
                .ThenInclude(c => c!.Section)
            .Where(e => e.StudentId == request.StudentId && e.Status == EnrollmentStatus.Active)
            .OrderByDescending(e => e.EnrollmentDate)
            .FirstOrDefaultAsync(cancellationToken);

        var classroomId = enrollment?.ClassroomId;
        var className = enrollment?.Classroom?.Name ?? "—";
        var academicYear = enrollment?.Classroom?.AcademicYear?.Name ?? "—";
        var maxSectionGrade = (double)(enrollment?.Classroom?.Section?.MaxGradeValue ?? 20);

        // Grades
        var grades = await db.Set<Grade>()
            .Include(g => g.Subject)
            .Where(g => g.StudentId == request.StudentId)
            .ToListAsync(cancellationToken);

        var subjectGrades = grades
            .GroupBy(g => g.Subject?.Name ?? "Inconnue")
            .Select(grp => new SubjectGradeSummary(
                grp.Key,
                (double)grp.Average(g => g.Score),
                (double)grp.Max(g => g.MaxScore)
            ))
            .ToList();

        double? overallAverage = grades.Count > 0
            ? Math.Round((double)grades.Average(g => (g.Score / g.MaxScore) * (decimal)maxSectionGrade), 2)
            : null;

        // Attendance (last 30 days)
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var attendance = await db.Set<Attendance>()
            .Where(a => a.StudentId == request.StudentId && a.Date >= thirtyDaysAgo)
            .OrderByDescending(a => a.Date)
            .Take(20)
            .ToListAsync(cancellationToken);

        int totalAbsences = attendance.Count(a => a.Status == AttendanceStatus.Absent);
        int totalLate = attendance.Count(a => a.Status == AttendanceStatus.Late);

        var recentAttendance = attendance.Select(a => new AttendanceSummaryItem(
            a.Date,
            a.Status.ToString(),
            a.Remarks
        )).ToList();

        // Invoices
        var invoices = await db.Set<StudentInvoice>()
            .Include(i => i.Payments)
            .Where(i => i.StudentId == request.StudentId)
            .OrderByDescending(i => i.DueDate)
            .ToListAsync(cancellationToken);

        decimal totalDue = invoices.Sum(i => i.Amount);
        decimal totalPaid = invoices.Sum(i => i.Payments.Sum(p => p.Amount));

        var invoiceSummaries = invoices.Select(i =>
        {
            var paid = i.Payments.Sum(p => p.Amount);
            return new StudentInvoiceSummary(
                i.Id,
                i.Description,
                i.Amount,
                paid,
                i.Status.ToString(),
                i.DueDate
            );
        }).ToList();

        // Today's schedule
        var todayDay = DateTime.UtcNow.DayOfWeek;
        var todaySchedule = classroomId.HasValue
            ? await db.Set<ClassSchedule>()
                .Include(cs => cs.Subject)
                .Include(cs => cs.Teacher)
                .Where(cs => cs.ClassroomId == classroomId.Value && cs.DayOfWeek == todayDay)
                .OrderBy(cs => cs.StartTime)
                .Select(cs => new ScheduleSummary(
                    cs.StartTime.ToString(@"hh\:mm"),
                    cs.EndTime.ToString(@"hh\:mm"),
                    cs.Subject != null ? cs.Subject.Name : "—",
                    cs.Teacher != null ? $"{cs.Teacher.FirstName} {cs.Teacher.LastName}" : "—"
                ))
                .ToListAsync(cancellationToken)
            : new List<ScheduleSummary>();

        // Sanctions
        var sanctions = await db.Set<Sanction>()
            .Where(s => s.StudentId == request.StudentId)
            .OrderByDescending(s => s.DateIncurred)
            .Select(s => new SanctionSummary(s.Id, s.Type.ToString(), s.Reason, s.DateIncurred, s.DurationDays))
            .ToListAsync(cancellationToken);

        return new StudentDashboardDto(
            student.Id,
            student.FullName,
            student.StudentNumber,
            className,
            academicYear,
            overallAverage.HasValue ? Math.Round(overallAverage.Value, 2) : null,
            totalAbsences,
            totalLate,
            totalDue,
            totalPaid,
            totalDue - totalPaid,
            subjectGrades,
            recentAttendance,
            invoiceSummaries,
            todaySchedule,
            sanctions,
            maxSectionGrade
        );
    }
}
