using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a specific professional specialty or program (Filière/Série). 
/// Examples: "Secrétariat de Direction", "Comptabilité et Gestion", "Santé - Infirmier d'État", "Agropastoral".
/// </summary>
public class Specialty : TenantEntity
{
    public string Name { get; private set; } = string.Empty; // e.g. "Comptabilité"
    public string Code { get; private set; } = string.Empty; // e.g. "COMPTA", "INF"
    public string? Description { get; private set; }
    
    // Some specialties might have different tuition fees or durations.
    public decimal? DefaultTuitionFee { get; private set; } 
    
    public bool IsActive { get; private set; } = true;

    // A specialty belongs to a section/cycle (e.g. Stage "Professionnel")
    public Guid SchoolSectionId { get; private set; }

    // Navigation
    public SchoolSection? Section { get; private set; }

    private readonly List<Classroom> _classrooms = new();
    public IReadOnlyCollection<Classroom> Classrooms => _classrooms.AsReadOnly();

    private Specialty() { }

    public static Specialty Create(
        Guid tenantId,
        string name,
        string code,
        Guid schoolSectionId,
        decimal? defaultTuitionFee = null,
        string? description = null)
    {
        return new Specialty
        {
            TenantId = tenantId,
            Name = name,
            Code = code,
            SchoolSectionId = schoolSectionId,
            DefaultTuitionFee = defaultTuitionFee,
            Description = description
        };
    }

    public void Update(string name, string code, Guid schoolSectionId, decimal? defaultTuitionFee, string? description)
    {
        Name = name;
        Code = code;
        SchoolSectionId = schoolSectionId;
        DefaultTuitionFee = defaultTuitionFee;
        Description = description;
    }

    public void Deactivate() => IsActive = false;
}
