using SchoolERP.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace SchoolERP.Infrastructure.Services;

/// <summary>
/// Mock implementation of the notification service for simulation purposes.
/// In production, this would connect to an SMS Gateway like Orange SMS, Twilio, or Kaleyra.
/// </summary>
public class MockNotificationService : INotificationService
{
    private readonly ILogger<MockNotificationService> _logger;

    public MockNotificationService(ILogger<MockNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendSmsAsync(string phoneNumber, string message)
    {
        _logger.LogInformation("🚀 [SIMULATION SMS] Sending to {Phone}: {Message}", phoneNumber, message);
        // Simulate network delay
        return Task.CompletedTask;
    }

    public Task SendEmailAsync(string emailAddress, string subject, string body)
    {
        _logger.LogInformation("📧 [SIMULATION EMAIL] Sending to {Email}: {Subject}", emailAddress, subject);
        return Task.CompletedTask;
    }
}
