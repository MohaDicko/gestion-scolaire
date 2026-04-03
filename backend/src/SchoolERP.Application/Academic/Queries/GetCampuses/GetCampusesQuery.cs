using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Queries.GetCampuses;

public record CampusDto(Guid Id, string Name, string Address, string? City);

public record GetCampusesQuery() : IRequest<List<CampusDto>>;

public class GetCampusesQueryHandler : IRequestHandler<GetCampusesQuery, List<CampusDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCampusesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<CampusDto>> Handle(GetCampusesQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        return await db.Set<SchoolERP.Domain.Academic.Campus>()
            .Select(c => new CampusDto(c.Id, c.Name, c.Address, c.City))
            .ToListAsync(cancellationToken);
    }
}
