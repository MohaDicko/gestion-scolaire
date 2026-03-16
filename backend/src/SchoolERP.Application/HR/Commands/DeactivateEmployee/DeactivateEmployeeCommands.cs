using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;

namespace SchoolERP.Application.HR.Commands.DeactivateEmployee;

public record DeactivateEmployeeCommand(Guid Id) : IRequest;

public class DeactivateEmployeeCommandHandler : IRequestHandler<DeactivateEmployeeCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeactivateEmployeeCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeactivateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var employee = await db.Set<Employee>()
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (employee == null) return;

        employee.Deactivate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
public record ActivateEmployeeCommand(Guid Id) : IRequest;
public class ActivateEmployeeCommandHandler : IRequestHandler<ActivateEmployeeCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    public ActivateEmployeeCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;
    public async Task Handle(ActivateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var employee = await db.Set<Employee>().FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);
        if (employee != null) { employee.Activate(); await _unitOfWork.SaveChangesAsync(cancellationToken); }
    }
}
