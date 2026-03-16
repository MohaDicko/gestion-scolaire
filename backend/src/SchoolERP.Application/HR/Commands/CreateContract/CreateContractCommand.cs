using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.HR.Commands.CreateContract;

public record CreateContractCommand(
    Guid EmployeeId,
    ContractType ContractType,
    DateTime StartDate,
    DateTime? EndDate,
    decimal BaseSalary
) : IRequest<Guid>;

public class CreateContractCommandHandler : IRequestHandler<CreateContractCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public CreateContractCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateContractCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        var employeeExists = await db.Set<Employee>().AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);
        if (!employeeExists) throw new DomainException("Employee not found.");

        var newContract = Contract.Create(
            _tenantService.GetCurrentTenantId(),
            request.EmployeeId,
            request.ContractType,
            request.StartDate,
            request.EndDate,
            request.BaseSalary
        );

        await db.Set<Contract>().AddAsync(newContract, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return newContract.Id;
    }
}
