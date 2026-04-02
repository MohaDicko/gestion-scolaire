using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Notifications;

public enum NotificationType
{
    InvoiceOverdue = 1,
    GradePublished = 2,
    AbsenceAlert = 3,
    PaymentReceived = 4,
    GeneralAnnouncement = 5,
    ContractExpiring = 6
}

public class Notification : TenantEntity
{
    public Guid? RecipientUserId { get; private set; } // null = broadcast to all
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public NotificationType Type { get; private set; }
    public bool IsRead { get; private set; }
    public string? LinkUrl { get; private set; } // e.g. /finance/invoices/xxx

    private Notification() { }

    public static Notification Create(
        Guid tenantId,
        string title,
        string body,
        NotificationType type,
        Guid? recipientUserId = null,
        string? linkUrl = null)
    {
        return new Notification
        {
            TenantId = tenantId,
            Title = title,
            Body = body,
            Type = type,
            RecipientUserId = recipientUserId,
            IsRead = false,
            LinkUrl = linkUrl
        };
    }

    public void MarkAsRead() => IsRead = true;
}
