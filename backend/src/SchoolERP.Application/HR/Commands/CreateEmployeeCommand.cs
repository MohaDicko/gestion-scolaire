using MediatR;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.HR.Commands.CreateEmployee;

public record CreateEmployeeCommand(
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    DateTime DateOfBirth,
    Gender Gender,
    DateTime HireDate,
    EmployeeType EmployeeType,
    Guid DepartmentId,
    Guid CampusId
) : IRequest<Guid>;

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;
    private readonly IRepository<Employee> _repository;

    public CreateEmployeeCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService, IRepository<Employee> repository)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
        _repository = repository;
    }

    public async Task<Guid> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        
        var employee = Employee.Create(
            tenantId,
            request.FirstName,
            request.LastName,
            request.Email,
            request.PhoneNumber,
            request.DateOfBirth,
            request.Gender,
            request.HireDate,
            request.EmployeeType,
            request.DepartmentId,
            request.CampusId
        );

        await _repository.AddAsync(employee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return employee.Id;
    }
}
