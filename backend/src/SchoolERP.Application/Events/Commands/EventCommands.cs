using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Events;

namespace SchoolERP.Application.Events.Commands;

public record CreateEventCommand(
    string Title,
    string? Description,
    DateTime StartDate,
    DateTime EndDate,
    int CategoryId,
    bool IsAllDay = false,
    string? Location = null
) : IRequest<Guid>;

public record DeleteEventCommand(Guid EventId) : IRequest;

public class CreateEventCommandHandler : IRequestHandler<CreateEventCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public CreateEventCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateEventCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.GetCurrentTenantId();

        var ev = SchoolEvent.Create(
            tenantId,
            request.Title,
            request.Description,
            request.StartDate,
            request.EndDate,
            (EventCategory)request.CategoryId,
            request.IsAllDay,
            request.Location
        );

        var db = (DbContext)_unitOfWork;
        await db.Set<SchoolEvent>().AddAsync(ev, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ev.Id;
    }
}

public class DeleteEventCommandHandler : IRequestHandler<DeleteEventCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteEventCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteEventCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var ev = await db.Set<SchoolEvent>().FindAsync(new object[] { request.EventId }, cancellationToken);
        if (ev != null)
        {
            db.Set<SchoolEvent>().Remove(ev);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
