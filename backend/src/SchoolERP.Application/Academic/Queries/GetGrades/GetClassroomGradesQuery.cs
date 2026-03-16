using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Queries.GetGrades;

public record GradeDto(
    Guid Id,
    Guid StudentId,
    string StudentName,
    string StudentNumber,
    decimal Score,
    decimal MaxScore,
    string? Comment);

public record GetClassroomGradesQuery(
    Guid ClassroomId,
    Guid SubjectId,
    Guid AcademicYearId,
    int Semester,
    ExamType ExamType) : IRequest<IEnumerable<GradeDto>>;

public class GetClassroomGradesQueryHandler : IRequestHandler<GetClassroomGradesQuery, IEnumerable<GradeDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetClassroomGradesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<GradeDto>> Handle(GetClassroomGradesQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        // Get students in this classroom
        var studentIdsInClass = await db.Set<Enrollment>()
            .Where(e => e.ClassroomId == request.ClassroomId && e.AcademicYearId == request.AcademicYearId && e.Status == EnrollmentStatus.Active)
            .Select(e => e.StudentId)
            .ToListAsync(cancellationToken);

        // Get grades for those students
        var grades = await db.Set<Grade>()
            .Include(g => g.Student)
            .Where(g => g.SubjectId == request.SubjectId &&
                        g.AcademicYearId == request.AcademicYearId &&
                        g.Semester == request.Semester &&
                        g.ExamType == request.ExamType &&
                        studentIdsInClass.Contains(g.StudentId))
            .Select(g => new GradeDto(
                g.Id,
                g.StudentId,
                $"{g.Student!.FirstName} {g.Student.LastName}",
                g.Student.StudentNumber,
                g.Score,
                g.MaxScore,
                g.Comment
            ))
            .OrderBy(g => g.StudentName)
            .ToListAsync(cancellationToken);

        return grades;
    }
}
