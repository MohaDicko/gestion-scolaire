using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Application.Academic.Commands.Schedules;

public record SetClassScheduleCommand(
    Guid ClassroomId,
    List<ScheduleInput> Schedules
) : IRequest;

public record ScheduleInput(
    Guid SubjectId,
    Guid TeacherId,
    int DayOfWeek, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    string StartTime, // "08:00"
    string EndTime // "10:00"
);

public class SetClassScheduleCommandHandler : IRequestHandler<SetClassScheduleCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public SetClassScheduleCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task Handle(SetClassScheduleCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        // Remove existing schedules for this classroom
        var existing = await db.Set<ClassSchedule>().Where(x => x.ClassroomId == request.ClassroomId).ToListAsync(cancellationToken);
        db.Set<ClassSchedule>().RemoveRange(existing);

        var tenantId = _tenantService.GetCurrentTenantId();

        // Add new schedules
        foreach (var input in request.Schedules)
        {
            if (!TimeSpan.TryParse(input.StartTime, out var start) || !TimeSpan.TryParse(input.EndTime, out var end))
                continue; // Ignore invalid times

            var schedule = ClassSchedule.Create(
                tenantId,
                request.ClassroomId,
                input.SubjectId,
                input.TeacherId,
                (DayOfWeek)input.DayOfWeek,
                start,
                end
            );
            
            await db.Set<ClassSchedule>().AddAsync(schedule, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
