using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Academic.Queries.GetClassrooms;

namespace SchoolERP.Application.Academic.Queries.GetClassroomById;

public record GetClassroomByIdQuery(Guid Id) : IRequest<ClassroomDto?>;

public class GetClassroomByIdQueryHandler : IRequestHandler<GetClassroomByIdQuery, ClassroomDto?>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetClassroomByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ClassroomDto?> Handle(GetClassroomByIdQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        return await db.Set<Classroom>()
            .Include(c => c.AcademicYear)
            .Include(c => c.Section)
            .Include(c => c.Campus)
            .Include(c => c.Enrollments)
            .Where(c => c.Id == request.Id)
            .Select(c => new ClassroomDto(
                c.Id,
                c.Name,
                c.Level,
                c.MaxCapacity,
                c.Enrollments.Count,
                c.AcademicYear != null ? c.AcademicYear.Name : "N/A",
                c.Section != null ? c.Section.Name : "N/A",
                c.Campus != null ? c.Campus.Name : "N/A"
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
