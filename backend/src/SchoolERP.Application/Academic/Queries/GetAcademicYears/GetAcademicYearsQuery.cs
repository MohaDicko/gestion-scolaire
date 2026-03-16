using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.Academic.Queries.GetAcademicYears;

public record GetAcademicYearsQuery : IRequest<List<AcademicYearDto>>;

public record AcademicYearDto(
    Guid Id,
    string Name,
    bool IsCurrent
);

public class GetAcademicYearsQueryHandler : IRequestHandler<GetAcademicYearsQuery, List<AcademicYearDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAcademicYearsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<AcademicYearDto>> Handle(GetAcademicYearsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        return await db.Set<AcademicYear>()
            .Select(ay => new AcademicYearDto(ay.Id, ay.Name, ay.IsCurrent))
            .ToListAsync(cancellationToken);
    }
}
