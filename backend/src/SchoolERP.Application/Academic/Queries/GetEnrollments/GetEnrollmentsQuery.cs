using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;

namespace SchoolERP.Application.Academic.Queries.GetEnrollments;

public record GetEnrollmentsQuery(
    Guid? ClassroomId = null,
    Guid? AcademicYearId = null
) : IRequest<List<EnrollmentDto>>;

public record EnrollmentDto(
    Guid Id,
    Guid StudentId,
    string StudentName,
    string StudentNumber,
    Guid ClassroomId,
    string ClassroomName,
    string AcademicYearName,
    string Status,
    DateTime EnrollmentDate
);

public class GetEnrollmentsQueryHandler : IRequestHandler<GetEnrollmentsQuery, List<EnrollmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEnrollmentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<EnrollmentDto>> Handle(GetEnrollmentsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var query = db.Set<Enrollment>()
            .Include(e => e.Student)
            .Include(e => e.Classroom)
            .Include(e => e.AcademicYear)
            .AsQueryable();

        if (request.ClassroomId.HasValue)
            query = query.Where(e => e.ClassroomId == request.ClassroomId.Value);

        if (request.AcademicYearId.HasValue)
            query = query.Where(e => e.AcademicYearId == request.AcademicYearId.Value);

        return await query
            .OrderByDescending(e => e.EnrollmentDate)
            .Select(e => new EnrollmentDto(
                e.Id,
                e.StudentId,
                e.Student != null ? e.Student.FullName : "N/A",
                e.Student != null ? e.Student.StudentNumber : "N/A",
                e.ClassroomId,
                e.Classroom != null ? e.Classroom.Name : "N/A",
                e.AcademicYear != null ? e.AcademicYear.Name : "N/A",
                e.Status.ToString(),
                e.EnrollmentDate
            ))
            .ToListAsync(cancellationToken);
    }
}
