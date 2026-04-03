namespace SchoolERP.Domain.Interfaces;

/// <summary>
/// Service to handle outgoing communications to parents and staff (SMS/Email/WhatsApp).
/// </summary>
public interface INotificationService
{
    Task SendSmsAsync(string phoneNumber, string message);
    Task SendEmailAsync(string emailAddress, string subject, string body);
}
