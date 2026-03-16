using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.Academic.Commands.Classrooms;

public record DeleteClassroomCommand(Guid Id) : IRequest;

public class DeleteClassroomCommandHandler : IRequestHandler<DeleteClassroomCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteClassroomCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteClassroomCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var classroom = await db.Set<Classroom>()
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (classroom == null) return;

        if (classroom.Enrollments.Any())
        {
            throw new Exception("Cannot delete a classroom that has students enrolled. Please move or remove students first.");
        }

        db.Remove(classroom);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
