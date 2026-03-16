using MediatR;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Commands.Students;

public record DeactivateStudentCommand(Guid Id) : IRequest<Unit>;

public class DeactivateStudentCommandHandler : IRequestHandler<DeactivateStudentCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRepository<Student> _repository;

    public DeactivateStudentCommandHandler(IUnitOfWork unitOfWork, IRepository<Student> repository)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
    }

    public async Task<Unit> Handle(DeactivateStudentCommand request, CancellationToken cancellationToken)
    {
        var student = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (student == null) throw new KeyNotFoundException($"Student {request.Id} not found.");

        student.Deactivate();

        await _repository.UpdateAsync(student, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
