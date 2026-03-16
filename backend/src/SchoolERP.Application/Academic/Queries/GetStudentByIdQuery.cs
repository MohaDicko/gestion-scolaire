using MediatR;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Academic.Queries.GetStudents; // for StudentDto

namespace SchoolERP.Application.Academic.Queries.GetStudentById;

public record GetStudentByIdQuery(Guid Id) : IRequest<StudentDto?>;

public class GetStudentByIdQueryHandler : IRequestHandler<GetStudentByIdQuery, StudentDto?>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStudentByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StudentDto?> Handle(GetStudentByIdQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var student = await db.Set<Student>()
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (student == null) return null;

        return new StudentDto(
            student.Id,
            student.FirstName,
            student.LastName,
            student.StudentNumber,
            student.Gender.ToString(),
            student.DateOfBirth,
            student.IsActive,
            student.PhotoUrl
        );
    }
}
