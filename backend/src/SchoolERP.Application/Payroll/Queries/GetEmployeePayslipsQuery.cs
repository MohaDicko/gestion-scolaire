using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;

namespace SchoolERP.Application.Payroll.Queries.GetEmployeePayslips;

public record PayslipDto(
    Guid Id,
    int Month,
    int Year,
    decimal GrossSalary,
    decimal NetSalary,
    string Status,
    DateTime CreatedAt);

public record GetEmployeePayslipsQuery(Guid EmployeeId) : IRequest<List<PayslipDto>>;

public class GetEmployeePayslipsQueryHandler : IRequestHandler<GetEmployeePayslipsQuery, List<PayslipDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEmployeePayslipsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PayslipDto>> Handle(GetEmployeePayslipsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        return await db.Set<Payslip>()
            .Where(p => p.EmployeeId == request.EmployeeId)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => new PayslipDto(
                p.Id,
                p.Month,
                p.Year,
                p.GrossSalary,
                p.NetSalary,
                p.Status.ToString(),
                p.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
