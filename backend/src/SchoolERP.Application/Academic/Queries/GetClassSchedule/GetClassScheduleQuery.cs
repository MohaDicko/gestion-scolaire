using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using System.Text.Json.Serialization;

namespace SchoolERP.Application.Academic.Queries.GetClassSchedule;

public record GetClassScheduleQuery(Guid ClassroomId) : IRequest<List<ScheduleDto>>;

public record ScheduleDto(
    Guid Id,
    Guid SubjectId,
    string SubjectName,
    Guid TeacherId,
    string TeacherName,
    int DayOfWeek,
    string StartTime,
    string EndTime
);

public class GetClassScheduleQueryHandler : IRequestHandler<GetClassScheduleQuery, List<ScheduleDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetClassScheduleQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ScheduleDto>> Handle(GetClassScheduleQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        var schedules = await db.Set<ClassSchedule>()
            .Include(x => x.Subject)
            .Include(x => x.Teacher)
            .Where(x => x.ClassroomId == request.ClassroomId)
            .OrderBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);

        return schedules.Select(s => new ScheduleDto(
            s.Id,
            s.SubjectId,
            s.Subject != null ? s.Subject.Name : "Unknown",
            s.TeacherId,
            s.Teacher != null ? $"{s.Teacher.FirstName} {s.Teacher.LastName}" : "Unknown",
            (int)s.DayOfWeek,
            s.StartTime.ToString(@"hh\:mm"),
            s.EndTime.ToString(@"hh\:mm")
        )).ToList();
    }
}
