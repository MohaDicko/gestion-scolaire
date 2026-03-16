using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Queries.GetSubjects;

public record SubjectDto(Guid Id, string Name, string Code, decimal Coefficient);

public record GetSubjectsQuery : IRequest<IEnumerable<SubjectDto>>;

public class GetSubjectsQueryHandler : IRequestHandler<GetSubjectsQuery, IEnumerable<SubjectDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetSubjectsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<SubjectDto>> Handle(GetSubjectsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        var subjects = await db.Set<Subject>()
            .Where(s => s.IsActive)
            .Select(s => new SubjectDto(s.Id, s.Name, s.Code, s.Coefficient))
            .ToListAsync(cancellationToken);

        return subjects;
    }
}
