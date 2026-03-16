using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;

namespace SchoolERP.Application.Payroll.Queries.GetPayrollRuns;

public record GetPayrollRunsQuery : IRequest<List<PayrollRunDto>>;

public record PayrollRunDto(
    Guid Id,
    int Month,
    int Year,
    string Status,
    int PayslipCount,
    decimal TotalAmount, // Renamed from TotalNetSalary
    DateTime ProcessedAt // Renamed from RunDate
);

public class GetPayrollRunsQueryHandler : IRequestHandler<GetPayrollRunsQuery, List<PayrollRunDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPayrollRunsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PayrollRunDto>> Handle(GetPayrollRunsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        var runs = await db.Set<PayrollRun>()
            .Include(r => r.Payslips)
            .OrderByDescending(r => r.Year)
            .ThenByDescending(r => r.Month)
            .ToListAsync(cancellationToken);

        return runs.Select(r => new PayrollRunDto(
            r.Id,
            r.Month,
            r.Year,
            r.Status.ToString(),
            r.Payslips.Count,
            r.Payslips.Sum(p => p.NetSalary),
            r.RunDate
        )).ToList();
    }
}
