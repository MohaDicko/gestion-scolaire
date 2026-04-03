using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.Academic.Commands.Classrooms;

public record CreateClassroomCommand(
    string Name,
    string Level,
    int MaxCapacity,
    Guid AcademicYearId,
    Guid SchoolSectionId,
    Guid CampusId,
    string? Stream = null,
    Guid? SpecialtyId = null
) : IRequest<Guid>;

public class CreateClassroomCommandHandler : IRequestHandler<CreateClassroomCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public CreateClassroomCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateClassroomCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        var classroom = Classroom.Create(
            tenantId,
            request.Name,
            request.Level,
            request.MaxCapacity,
            request.AcademicYearId,
            request.CampusId,
            request.SchoolSectionId,
            request.SpecialtyId,
            request.Stream
        );

        db.Add(classroom);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return classroom.Id;
    }
}
