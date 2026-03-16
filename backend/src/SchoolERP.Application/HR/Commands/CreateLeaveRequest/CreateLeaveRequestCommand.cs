using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Application.HR.Commands.CreateLeaveRequest;

public record CreateLeaveRequestCommand(
    Guid EmployeeId,
    LeaveType LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    string Reason
) : IRequest<Guid>;

public class CreateLeaveRequestCommandHandler : IRequestHandler<CreateLeaveRequestCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public CreateLeaveRequestCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateLeaveRequestCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        var employeeExists = await db.Set<Employee>().AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);
        if (!employeeExists) throw new DomainException("Employee not found.");

        var leaveRequest = LeaveRequest.Submit(
            _tenantService.GetCurrentTenantId(),
            request.EmployeeId,
            request.LeaveType,
            request.StartDate,
            request.EndDate,
            request.Reason
        );

        await db.Set<LeaveRequest>().AddAsync(leaveRequest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return leaveRequest.Id;
    }
}
