using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Events;

namespace SchoolERP.Application.Events.Queries;

public record GetEventsQuery(int? Year = null, int? Month = null) : IRequest<List<SchoolEventDto>>;

public record SchoolEventDto(
    Guid Id,
    string Title,
    string? Description,
    DateTime StartDate,
    DateTime EndDate,
    int CategoryId,
    string CategoryName,
    bool IsAllDay,
    string? Location
);

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, List<SchoolEventDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEventsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<SchoolEventDto>> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        var query = db.Set<SchoolEvent>().AsQueryable();

        if (request.Year.HasValue && request.Month.HasValue)
        {
            var start = new DateTime(request.Year.Value, request.Month.Value, 1);
            var end = start.AddMonths(1);
            query = query.Where(e => e.StartDate < end && e.EndDate >= start);
        }

        var events = await query
            .OrderBy(e => e.StartDate)
            .ToListAsync(cancellationToken);

        return events.Select(e => new SchoolEventDto(
            e.Id,
            e.Title,
            e.Description,
            e.StartDate,
            e.EndDate,
            (int)e.Category,
            e.Category.ToString(),
            e.IsAllDay,
            e.Location
        )).ToList();
    }
}
