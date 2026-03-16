using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;

namespace SchoolERP.Application.HR.Queries.GetContracts;

public record GetContractsQuery() : IRequest<List<ContractDto>>;

public record ContractDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string ContractType,
    string Position,
    DateTime StartDate,
    DateTime? EndDate,
    decimal BaseSalary,
    string Status
);

public class GetContractsQueryHandler : IRequestHandler<GetContractsQuery, List<ContractDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetContractsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ContractDto>> Handle(GetContractsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        return await db.Set<Contract>()
            .Include(c => c.Employee)
            .OrderByDescending(c => c.StartDate)
            .Select(c => new ContractDto(
                c.Id,
                c.EmployeeId,
                c.Employee != null ? $"{c.Employee.FirstName} {c.Employee.LastName}" : "Unknown",
                c.ContractType.ToString(),
                c.Employee != null ? c.Employee.EmployeeType.ToString() : "N/A",
                c.StartDate,
                c.EndDate,
                c.BaseSalary,
                c.Status.ToString()
            ))
            .ToListAsync(cancellationToken);
    }
}
