using MediatR;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Commands.Students;

public record CreateStudentCommand(
    string FirstName,
    string LastName,
    DateTime DateOfBirth,
    Gender Gender,
    string NationalId,
    string ParentName,
    string ParentPhone,
    string ParentEmail,
    string ParentRelationship
) : IRequest<Guid>;

public class CreateStudentCommandHandler : IRequestHandler<CreateStudentCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;
    private readonly IRepository<Student> _repository;

    public CreateStudentCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService, IRepository<Student> repository)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
        _repository = repository;
    }

    public async Task<Guid> Handle(CreateStudentCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        
        var student = Student.Create(
            tenantId,
            request.FirstName,
            request.LastName,
            request.DateOfBirth,
            request.Gender,
            request.NationalId,
            request.ParentName,
            request.ParentPhone,
            request.ParentEmail,
            request.ParentRelationship
        );

        await _repository.AddAsync(student, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return student.Id;
    }
}
