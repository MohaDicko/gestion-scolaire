using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Queries.GetSchoolSections;

public record SchoolSectionDto(Guid Id, string Name, string Code, int MaxGradeValue);

public record GetSchoolSectionsQuery() : IRequest<List<SchoolSectionDto>>;

public class GetSchoolSectionsQueryHandler : IRequestHandler<GetSchoolSectionsQuery, List<SchoolSectionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetSchoolSectionsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<SchoolSectionDto>> Handle(GetSchoolSectionsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        return await db.Set<SchoolERP.Domain.Academic.SchoolSection>()
            .Where(s => s.IsActive)
            .Select(s => new SchoolSectionDto(s.Id, s.Name, s.Code, s.MaxGradeValue))
            .ToListAsync(cancellationToken);
    }
}
