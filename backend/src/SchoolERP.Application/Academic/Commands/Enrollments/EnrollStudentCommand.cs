using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Application.Academic.Commands.Enrollments;

public record EnrollStudentCommand(
    Guid StudentId,
    Guid ClassroomId,
    Guid AcademicYearId
) : IRequest<Guid>;

public class EnrollStudentCommandHandler : IRequestHandler<EnrollStudentCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public EnrollStudentCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(EnrollStudentCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        // 1. Check if student exists
        var student = await db.Set<Student>().FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken);
        if (student == null) throw new Exception("Student not found");

        // 2. Check if classroom exists
        var classroom = await db.Set<Classroom>().FirstOrDefaultAsync(c => c.Id == request.ClassroomId, cancellationToken);
        if (classroom == null) throw new Exception("Classroom not found");

        var currentEnrollmentCount = await db.Set<Enrollment>()
            .CountAsync(e => e.ClassroomId == request.ClassroomId, cancellationToken);
        
        if (currentEnrollmentCount >= classroom.MaxCapacity)
            throw new Exception($"Classroom {classroom.Name} is full ({classroom.MaxCapacity} max).");

        // 3. Check for existing active enrollment in the same year
        var existing = await db.Set<Enrollment>()
            .AnyAsync(e => e.StudentId == request.StudentId && e.AcademicYearId == request.AcademicYearId && e.Status == EnrollmentStatus.Active, cancellationToken);
        
        if (existing) throw new Exception("Student is already enrolled in a classroom for this academic year.");

        // 4. Create enrollment
        var enrollment = Enrollment.Create(tenantId, request.StudentId, request.ClassroomId, request.AcademicYearId);
        
        db.Add(enrollment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return enrollment.Id;
    }
}
