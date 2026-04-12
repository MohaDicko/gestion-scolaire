using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Payroll;
using SchoolERP.Domain.Finance;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.Dashboard.Queries;

public record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;

public record DashboardStatsDto(
    int TotalStudents,
    int TotalEmployees,
    int TotalClassrooms,
    int TotalPayslips,
    decimal TotalArrearsAmount,
    int StudentsWithArrearsCount,
    List<SpecialtyStatDto> StudentsBySpecialty,
    List<MonthlyRevenueDto> RecentRevenue
);

public record SpecialtyStatDto(string Name, int Count);
public record MonthlyRevenueDto(string Month, decimal Amount);

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDashboardStatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        var studentsCount = await db.Set<Student>().CountAsync(cancellationToken);
        var employeesCount = await db.Set<Employee>().CountAsync(cancellationToken);
        var classroomsCount = await db.Set<Classroom>().CountAsync(cancellationToken);
        var payslipsCount = await db.Set<Payslip>().CountAsync(cancellationToken);

        var unpaidInvoices = await db.Set<StudentInvoice>()
            .Where(i => i.Status != SchoolERP.Domain.Enums.InvoiceStatus.Paid)
            .Select(i => new { i.Amount, Paid = i.Payments.Sum(p => p.Amount) })
            .ToListAsync(cancellationToken);

        var totalArrears = unpaidInvoices.Sum(i => i.Amount - i.Paid);
        var studentsCountWithArrears = await db.Set<StudentInvoice>()
            .Where(i => i.Status != SchoolERP.Domain.Enums.InvoiceStatus.Paid)
            .Select(i => i.StudentId)
            .Distinct()
            .CountAsync(cancellationToken);

        // Specialty Distribution
        var specialtyStats = await db.Set<Enrollment>()
            .Where(e => e.Classroom != null && e.Classroom.Specialty != null)
            .GroupBy(e => e.Classroom!.Specialty!.Name)
            .Select(g => new SpecialtyStatDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        // Recent Revenue (Last 6 months)
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var recentRevenue = await db.Set<StudentPayment>()
            .Where(p => p.PaymentDate >= sixMonthsAgo)
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlyRevenueDto(
                $"{g.Key.Month}/{g.Key.Year}", 
                g.Sum(p => p.Amount)))
            .ToListAsync(cancellationToken);

        return new DashboardStatsDto(
            studentsCount,
            employeesCount,
            classroomsCount,
            payslipsCount,
            totalArrears,
            studentsCountWithArrears,
            specialtyStats,
            recentRevenue
        );
    }
}
