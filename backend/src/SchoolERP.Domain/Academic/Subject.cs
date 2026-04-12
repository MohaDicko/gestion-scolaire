using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a subject / matière (e.g., Mathematics, French, Biology).
/// </summary>
public class Subject : TenantEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty; // e.g. "MATH", "FR"
    public decimal Coefficient { get; private set; }         // Weight in final average calculation
    public bool IsStage { get; private set; } = false;      // True if it's a clinical internship/stage
    public bool IsActive { get; private set; } = true;

    private Subject() { }

    public static Subject Create(Guid tenantId, string name, string code, decimal coefficient, bool isStage = false)
    {
        return new Subject
        {
            TenantId = tenantId,
            Name = name,
            Code = code,
            Coefficient = coefficient,
            IsStage = isStage
        };
    }

    public void Update(string name, decimal coefficient) { Name = name; Coefficient = coefficient; }
    public void Deactivate() => IsActive = false;
}
