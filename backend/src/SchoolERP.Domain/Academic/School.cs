using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a school (a tenant in the SaaS system).
/// This is the root aggregate for the Academic context.
/// </summary>
public class School : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty; // Unique code e.g. "LYCEE-BAMAKO-01"
    public string Address { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public SchoolType Type { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool IsSetupComplete { get; private set; } = false; // Flag pour le Wizard d'onboarding
    public string? LogoUrl { get; private set; }
    public string? Motto { get; private set; }

    // Navigation
    private readonly List<AcademicYear> _academicYears = new();
    public IReadOnlyCollection<AcademicYear> AcademicYears => _academicYears.AsReadOnly();

    private School() { }

    public static School Create(
        string name, string code, string address,
        string city, string country, string phone, string email,
        SchoolType type)
    {
        return new School
        {
            Name = name,
            Code = code,
            Address = address,
            City = city,
            Country = country,
            PhoneNumber = phone,
            Email = email,
            Type = type,
            IsSetupComplete = false
        };
    }

    public void CompleteSetup() => IsSetupComplete = true;

    public void Update(string name, string address, string phone, string email, string? motto = null, string? logoUrl = null)
    {
        Name = name;
        Address = address;
        PhoneNumber = phone;
        Email = email;
        Motto = motto;
        LogoUrl = logoUrl;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
