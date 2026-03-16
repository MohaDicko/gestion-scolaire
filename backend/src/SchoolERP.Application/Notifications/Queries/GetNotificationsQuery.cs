using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Notifications;

namespace SchoolERP.Application.Notifications.Queries;

public record GetNotificationsQuery(Guid UserId) : IRequest<List<NotificationDto>>;

public record NotificationDto(
    Guid Id,
    string Title,
    string Body,
    int Type,
    string TypeName,
    bool IsRead,
    string? LinkUrl,
    DateTime CreatedAt
);

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetNotificationsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        var notifications = await db.Set<Notification>()
            .Where(n => n.RecipientUserId == null || n.RecipientUserId == request.UserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        return notifications.Select(n => new NotificationDto(
            n.Id,
            n.Title,
            n.Body,
            (int)n.Type,
            n.Type.ToString(),
            n.IsRead,
            n.LinkUrl,
            n.CreatedAt
        )).ToList();
    }
}
