using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.Academic.Queries.GetClassrooms;

public record GetClassroomsQuery : IRequest<List<ClassroomDto>>;

public record ClassroomDto(
    Guid Id,
    string Name,
    string Level,
    int MaxCapacity,
    int StudentCount,
    string AcademicYearName
);

public class GetClassroomsQueryHandler : IRequestHandler<GetClassroomsQuery, List<ClassroomDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetClassroomsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ClassroomDto>> Handle(GetClassroomsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        return await db.Set<Classroom>()
            .Include(c => c.AcademicYear)
            .Include(c => c.Enrollments)
            .Select(c => new ClassroomDto(
                c.Id,
                c.Name,
                c.Level,
                c.MaxCapacity,
                c.Enrollments.Count,
                c.AcademicYear != null ? c.AcademicYear.Name : "N/A"
            ))
            .ToListAsync(cancellationToken);
    }
}
