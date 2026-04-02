using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Events;

public enum EventCategory
{
    Exam = 1,
    Meeting = 2,
    Holiday = 3,
    SchoolTrip = 4,
    Ceremony = 5,
    Sports = 6,
    Other = 99
}

public class SchoolEvent : TenantEntity
{
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public EventCategory Category { get; private set; }
    public bool IsAllDay { get; private set; }
    public string? Location { get; private set; }

    private SchoolEvent() { }

    public static SchoolEvent Create(
        Guid tenantId,
        string title,
        string? description,
        DateTime startDate,
        DateTime endDate,
        EventCategory category,
        bool isAllDay = false,
        string? location = null)
    {
        return new SchoolEvent
        {
            TenantId = tenantId,
            Title = title,
            Description = description,
            StartDate = startDate,
            EndDate = endDate,
            Category = category,
            IsAllDay = isAllDay,
            Location = location
        };
    }

    public void Update(string title, string? description, DateTime startDate, DateTime endDate, EventCategory category, bool isAllDay, string? location)
    {
        Title = title;
        Description = description;
        StartDate = startDate;
        EndDate = endDate;
        Category = category;
        IsAllDay = isAllDay;
        Location = location;
    }
}
