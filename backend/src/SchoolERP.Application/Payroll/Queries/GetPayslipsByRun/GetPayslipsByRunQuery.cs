using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;

namespace SchoolERP.Application.Payroll.Queries.GetPayslipsByRun;

public record GetPayslipsByRunQuery(Guid RunId) : IRequest<List<PayslipInRunDto>>;

public record PayslipInRunDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string EmployeeNumber,
    string DepartmentName,
    int PeriodMonth,
    int PeriodYear,
    decimal BaseSalary,
    decimal TotalAllowances,
    decimal TotalDeductions,
    decimal NetSalary,
    string Status,
    List<PayslipLineDto> Lines
);

public record PayslipLineDto(
    string Label,
    string ElementType,
    decimal Amount
);

public class GetPayslipsByRunQueryHandler : IRequestHandler<GetPayslipsByRunQuery, List<PayslipInRunDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPayslipsByRunQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PayslipInRunDto>> Handle(GetPayslipsByRunQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        return await db.Set<Payslip>()
            .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
            .Include(p => p.Lines)
            .Where(p => p.PayrollRunId == request.RunId)
            .Select(p => new PayslipInRunDto(
                p.Id,
                p.EmployeeId,
                p.Employee != null ? p.Employee.FullName : "N/A",
                p.Employee != null ? p.Employee.EmployeeNumber : "N/A",
                p.Employee != null && p.Employee.Department != null ? p.Employee.Department.Name : "Général",
                p.Month,
                p.Year,
                p.GrossSalary,
                p.TotalAllowances,
                p.TotalDeductions,
                p.NetSalary,
                p.Status.ToString(),
                p.Lines.Select(l => new PayslipLineDto(l.Label, l.ElementType.ToString(), l.Amount)).ToList()
            ))
            .ToListAsync(cancellationToken);
    }
}
