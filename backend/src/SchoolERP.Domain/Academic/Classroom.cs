using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a classroom (e.g., "6ème A", "Terminale S").
/// </summary>
public class Classroom : TenantEntity
{
    public string Name { get; private set; } = string.Empty; // e.g. "6ème A"
    public string Level { get; private set; } = string.Empty; // e.g. "6ème"
    public string? Stream { get; private set; }              // e.g. "TSE", "TLL", "TSS" (Série)
    public int MaxCapacity { get; private set; }
    public Guid AcademicYearId { get; private set; }
    public Guid CampusId { get; private set; }
    public Guid SchoolSectionId { get; private set; }
    public Guid? SpecialtyId { get; private set; }

    // Navigation
    public AcademicYear? AcademicYear { get; private set; }
    public Campus? Campus { get; private set; }
    public SchoolSection? Section { get; private set; }
    public Specialty? Specialty { get; private set; }

    private readonly List<Enrollment> _enrollments = new();
    public IReadOnlyCollection<Enrollment> Enrollments => _enrollments.AsReadOnly();

    private Classroom() { }

    public static Classroom Create(Guid tenantId, string name, string level, int maxCapacity, Guid academicYearId, Guid campusId, Guid schoolSectionId, Guid? specialtyId = null, string? stream = null)
    {
        return new Classroom
        {
            TenantId = tenantId,
            Name = name,
            Level = level,
            Stream = stream,
            MaxCapacity = maxCapacity,
            AcademicYearId = academicYearId,
            CampusId = campusId,
            SchoolSectionId = schoolSectionId,
            SpecialtyId = specialtyId
        };
    }

    public void Update(string name, string level, int maxCapacity, string? stream = null)
    {
        Name = name;
        Level = level;
        Stream = stream;
        MaxCapacity = maxCapacity;
    }
}
