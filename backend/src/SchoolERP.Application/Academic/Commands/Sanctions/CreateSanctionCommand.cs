using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;

namespace SchoolERP.Application.Academic.Commands.Sanctions;

public record CreateSanctionCommand(
    Guid StudentId,
    Guid AcademicYearId,
    SanctionType Type,
    string Reason,
    DateTime DateIncurred,
    int? DurationDays = null,
    string? Remarks = null
) : IRequest<Guid>;

public class CreateSanctionCommandHandler : IRequestHandler<CreateSanctionCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public CreateSanctionCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateSanctionCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.GetCurrentTenantId();

        var sanction = Sanction.Create(
            tenantId,
            request.StudentId,
            request.AcademicYearId,
            request.Type,
            request.Reason,
            request.DateIncurred,
            request.DurationDays,
            request.Remarks
        );

        var db = (DbContext)_unitOfWork;
        await db.Set<Sanction>().AddAsync(sanction, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return sanction.Id;
    }
}
