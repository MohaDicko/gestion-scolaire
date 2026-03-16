using SchoolERP.Domain.Common;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents an academic year (e.g., 2024-2025).
/// </summary>
public class AcademicYear : TenantEntity
{
    public string Name { get; private set; } = string.Empty; // e.g. "2024-2025"
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public bool IsCurrent { get; private set; }

    private AcademicYear() { }

    public static AcademicYear Create(Guid tenantId, string name, DateTime startDate, DateTime endDate)
    {
        if (endDate <= startDate)
            throw new DomainException("End date must be after start date.");

        return new AcademicYear
        {
            TenantId = tenantId,
            Name = name,
            StartDate = startDate,
            EndDate = endDate,
            IsCurrent = false
        };
    }

    public void SetAsCurrent() => IsCurrent = true;
    public void SetAsInactive() => IsCurrent = false;
}
