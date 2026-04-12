using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Payroll;

namespace SchoolERP.Application.HR.Queries.GetEmployeeDetail;

public record GetEmployeeDetailQuery(Guid Id) : IRequest<EmployeeDetailDto>;

public record EmployeeDetailDto(
    Guid Id,
    string FirstName,
    string LastName,
    string EmployeeNumber,
    string Email,
    string PhoneNumber,
    string Address,
    string EmployeeType,
    string? DepartmentName,
    bool IsActive,
    string? PhotoUrl,
    DateTime HireDate,
    List<ContractDto> Contracts,
    List<PayslipSummaryDto> RecentPayslips
);

public record ContractDto(
    Guid Id,
    string Title,
    DateTime StartDate,
    DateTime? EndDate,
    decimal BaseSalary,
    string Status,
    string Type
);

public record PayslipSummaryDto(
    Guid Id,
    string Period,
    decimal NetSalary,
    DateTime GeneratedAt,
    string Status
);

public class GetEmployeeDetailQueryHandler : IRequestHandler<GetEmployeeDetailQuery, EmployeeDetailDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEmployeeDetailQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<EmployeeDetailDto> Handle(GetEmployeeDetailQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        var employee = await db.Set<Employee>()
            .Include(e => e.Department)
            .Include(e => e.Contracts)
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (employee == null) return null!;

        var payslips = await db.Set<Payslip>()
            .Where(p => p.EmployeeId == request.Id)
            .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
            .Take(5)
            .Select(p => new PayslipSummaryDto(
                p.Id,
                $"{p.Month}/{p.Year}",
                p.NetSalary,
                p.CreatedAt,
                p.Status.ToString()
            ))
            .ToListAsync(cancellationToken);

        return new EmployeeDetailDto(
            employee.Id,
            employee.FirstName,
            employee.LastName,
            employee.EmployeeNumber,
            employee.Email,
            employee.PhoneNumber,
            "", // Address not in domain
            employee.EmployeeType.ToString(),
            employee.Department?.Name,
            employee.IsActive,
            employee.PhotoUrl,
            employee.HireDate,
            employee.Contracts.OrderByDescending(c => c.StartDate).Select(c => new ContractDto(
                c.Id,
                c.ContractType.ToString(),
                c.StartDate,
                c.EndDate,
                c.BaseSalary,
                c.Status.ToString(),
                c.ContractType.ToString()
            )).ToList(),
            payslips
        );
    }
}
