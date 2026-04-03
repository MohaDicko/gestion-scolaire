using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a specific section or educational cycle within a school group (Tenant).
/// Examples: "Maternelle", "Premier Cycle", "Second Cycle", "Lycée", "Enseignement Technique".
/// </summary>
public class SchoolSection : TenantEntity
{
    public string Name { get; private set; } = string.Empty; // e.g. "Lycée"
    public string Code { get; private set; } = string.Empty; // e.g. "LYC", "PRIM"
    public string? Description { get; private set; }
    
    // Grading logic can be different per section (e.g. out of 10 for primary, out of 20 for secondary)
    public int MaxGradeValue { get; private set; } = 20; 

    public bool IsActive { get; private set; } = true;

    // Navigation
    private readonly List<Classroom> _classrooms = new();
    public IReadOnlyCollection<Classroom> Classrooms => _classrooms.AsReadOnly();

    private SchoolSection() { }

    public static SchoolSection Create(
        Guid tenantId,
        string name,
        string code,
        int maxGradeValue,
        string? description = null)
    {
        return new SchoolSection
        {
            TenantId = tenantId,
            Name = name,
            Code = code,
            MaxGradeValue = maxGradeValue,
            Description = description
        };
    }

    public void Update(string name, string code, int maxGradeValue, string? description)
    {
        Name = name;
        Code = code;
        MaxGradeValue = maxGradeValue;
        Description = description;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
