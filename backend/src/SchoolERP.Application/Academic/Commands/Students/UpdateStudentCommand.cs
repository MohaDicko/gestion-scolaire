using MediatR;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Commands.Students;

public record UpdateStudentCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string ParentName,
    string ParentPhone,
    string ParentEmail,
    string? PhotoUrl = null
) : IRequest<Unit>;

public class UpdateStudentCommandHandler : IRequestHandler<UpdateStudentCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRepository<Student> _repository;

    public UpdateStudentCommandHandler(IUnitOfWork unitOfWork, IRepository<Student> repository)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
    }

    public async Task<Unit> Handle(UpdateStudentCommand request, CancellationToken cancellationToken)
    {
        var student = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (student == null) throw new KeyNotFoundException($"Student {request.Id} not found.");

        student.Update(
            request.FirstName,
            request.LastName,
            request.ParentName,
            request.ParentPhone,
            request.ParentEmail,
            request.PhotoUrl
        );

        await _repository.UpdateAsync(student, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
