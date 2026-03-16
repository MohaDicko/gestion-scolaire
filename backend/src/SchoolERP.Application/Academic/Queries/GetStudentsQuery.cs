using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Common.Models;

namespace SchoolERP.Application.Academic.Queries.GetStudents;

public record GetStudentsQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? Search = null,
    Guid? ClassroomId = null,
    bool? IsActive = true
) : IRequest<PaginatedResult<StudentDto>>;

public record StudentDto(
    Guid Id,
    string FirstName,
    string LastName,
    string StudentNumber,
    string Gender,
    DateTime DateOfBirth,
    bool IsActive,
    string? PhotoUrl = null,
    string? ClassroomName = null,
    string? NationalId = null,
    string? ParentName = null,
    string? ParentPhone = null
);

public class GetStudentsQueryHandler : IRequestHandler<GetStudentsQuery, PaginatedResult<StudentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStudentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedResult<StudentDto>> Handle(GetStudentsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var query = db.Set<Student>().AsNoTracking();

        // ── Apply Filters ───────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(s => 
                s.FirstName.ToLower().Contains(search) || 
                s.LastName.ToLower().Contains(search) || 
                s.StudentNumber.ToLower().Contains(search));
        }

        if (request.ClassroomId.HasValue)
        {
            query = query.Where(s => s.Enrollments.Any(e => e.ClassroomId == request.ClassroomId.Value));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(s => s.IsActive == request.IsActive.Value);
        }

        // ── Pagination ──────────────────────────────────────────
        var count = await query.CountAsync(cancellationToken);
        
        var items = await query
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new StudentDto(
                s.Id,
                s.FirstName,
                s.LastName,
                s.StudentNumber,
                s.Gender.ToString(),
                s.DateOfBirth,
                s.IsActive,
                s.PhotoUrl,
                s.Enrollments.OrderByDescending(e => e.EnrollmentDate).Select(e => e.Classroom!.Name).FirstOrDefault(),
                s.NationalId,
                s.ParentName,
                s.ParentPhone
            ))
            .ToListAsync(cancellationToken);

        return PaginatedResult<StudentDto>.Create(items, count, request.PageNumber, request.PageSize);
    }
}
