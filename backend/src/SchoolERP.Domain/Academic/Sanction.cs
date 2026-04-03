using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Academic;

public enum SanctionType
{
    Warning = 1,      // Avertissement
    Blame = 2,        // Blâme
    Detention = 3,    // Consigne / Retenue
    Suspension = 4,   // Exclusion Temporaire
    Expulsion = 5     // Exclusion Définitive
}

public class Sanction : TenantEntity
{
    public Guid StudentId { get; private set; }
    public Student? Student { get; private set; }
    
    public Guid AcademicYearId { get; private set; }
    public SanctionType Type { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public DateTime DateIncurred { get; private set; }
    public int? DurationDays { get; private set; } // Pour les exclusions
    public string? Remarks { get; private set; }

    private Sanction() { }

    public static Sanction Create(
        Guid tenantId,
        Guid studentId,
        Guid academicYearId,
        SanctionType type,
        string reason,
        DateTime dateIncurred,
        int? durationDays = null,
        string? remarks = null)
    {
        return new Sanction
        {
            TenantId = tenantId,
            StudentId = studentId,
            AcademicYearId = academicYearId,
            Type = type,
            Reason = reason,
            DateIncurred = dateIncurred,
            DurationDays = durationDays,
            Remarks = remarks
        };
    }
}
