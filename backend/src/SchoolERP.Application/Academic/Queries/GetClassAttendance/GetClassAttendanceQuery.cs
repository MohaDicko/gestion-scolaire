using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Application.Academic.Queries.GetClassAttendance;

public record GetClassAttendanceQuery(Guid ClassroomId, DateTime Date) : IRequest<List<AttendanceDto>>;

public record AttendanceDto(
    Guid StudentId,
    string StudentName,
    string RollNumber,
    int Status,
    string Remarks
);

public class GetClassAttendanceQueryHandler : IRequestHandler<GetClassAttendanceQuery, List<AttendanceDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetClassAttendanceQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<AttendanceDto>> Handle(GetClassAttendanceQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var date = request.Date.Date;

        // Ensure we load students who are active in the classroom
        var query = from e in db.Set<Enrollment>().Include(x => x.Student)
                    where e.ClassroomId == request.ClassroomId && e.Status == EnrollmentStatus.Active
                    select e.Student;

        var students = await query.ToListAsync(cancellationToken);

        // Load existing attendance records for the day
        var attendances = await db.Set<Attendance>()
            .Where(a => a.ClassroomId == request.ClassroomId && a.Date == date)
            .ToDictionaryAsync(a => a.StudentId, cancellationToken);

        // Map everything to a DTO List
        var result = new List<AttendanceDto>();

        foreach (var student in students.Where(s => s != null))
        {
            var isMarked = attendances.TryGetValue(student!.Id, out var attendance);
            result.Add(new AttendanceDto(
                student.Id,
                $"{student.FirstName} {student.LastName}",
                student.StudentNumber,
                isMarked ? (int)attendance!.Status : 0, // Default to Present (0)
                isMarked ? attendance!.Remarks : ""
            ));
        }

        return result.OrderBy(x => x.StudentName).ToList();
    }
}
