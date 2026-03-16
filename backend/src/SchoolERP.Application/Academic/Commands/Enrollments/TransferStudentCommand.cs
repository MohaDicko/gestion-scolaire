using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Commands.Enrollments;

public record TransferStudentCommand(Guid StudentId, Guid NewClassroomId, Guid AcademicYearId) : IRequest;

public class TransferStudentCommandHandler : IRequestHandler<TransferStudentCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public TransferStudentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(TransferStudentCommand request, CancellationToken cancellationToken)
    {
        var dbContent = (DbContext)_unitOfWork;

        var enrollment = await dbContent.Set<Enrollment>()
            .FirstOrDefaultAsync(e => 
                e.StudentId == request.StudentId && 
                e.AcademicYearId == request.AcademicYearId &&
                e.Status == SchoolERP.Domain.Enums.EnrollmentStatus.Active, 
                cancellationToken);

        if (enrollment == null)
        {
            throw new Exception("Active enrollment not found for this student in the specified academic year.");
        }

        enrollment.Transfer(request.NewClassroomId);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
