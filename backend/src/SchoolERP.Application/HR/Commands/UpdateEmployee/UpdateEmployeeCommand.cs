using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;

namespace SchoolERP.Application.HR.Commands.UpdateEmployee;

public record UpdateEmployeeCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    Guid DepartmentId,
    string? PhotoUrl = null
) : IRequest;

public class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateEmployeeCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var employee = await db.Set<Employee>()
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (employee == null) throw new Exception("Employee not found");

        employee.Update(
            request.FirstName,
            request.LastName,
            request.Email,
            request.PhoneNumber,
            request.DepartmentId,
            request.PhotoUrl
        );

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
