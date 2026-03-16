using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Notifications;

namespace SchoolERP.Application.Notifications.Commands;

public record SendNotificationCommand(
    string Title,
    string Body,
    int TypeId,
    Guid? RecipientUserId = null,
    string? LinkUrl = null
) : IRequest<Guid>;

public record MarkNotificationReadCommand(Guid NotificationId) : IRequest;

public class SendNotificationCommandHandler : IRequestHandler<SendNotificationCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public SendNotificationCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var notification = Notification.Create(
            tenantId,
            request.Title,
            request.Body,
            (NotificationType)request.TypeId,
            request.RecipientUserId,
            request.LinkUrl
        );

        var db = (DbContext)_unitOfWork;
        await db.Set<Notification>().AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return notification.Id;
    }
}

public class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public MarkNotificationReadCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var notification = await db.Set<Notification>().FindAsync(new object[] { request.NotificationId }, cancellationToken);
        if (notification == null) return;

        notification.MarkAsRead();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
