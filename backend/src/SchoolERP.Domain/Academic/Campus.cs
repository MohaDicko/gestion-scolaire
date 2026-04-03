using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a specific campus, branch, or site of a school établissement.
/// Examples: "Site de Bamako-Coura", "Antenne de Ségou", "Campus B de Kalaban-Coro".
/// </summary>
public class Campus : TenantEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Region { get; private set; } = string.Empty; // e.g. "Bamako", "Koulikoro"
    public string PhoneNumber { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string? ManagerName { get; private set; } // Principal or site manager
    
    public bool IsActive { get; private set; } = true;

    // Navigation records
    private readonly List<Classroom> _classrooms = new();
    public IReadOnlyCollection<Classroom> Classrooms => _classrooms.AsReadOnly();

    private readonly List<Student> _students = new();
    public IReadOnlyCollection<Student> Students => _students.AsReadOnly();

    private Campus() { }

    public static Campus Create(
        Guid tenantId,
        string name,
        string address,
        string city,
        string region,
        string phone,
        string? email = null,
        string? managerName = null)
    {
        return new Campus
        {
            TenantId = tenantId,
            Name = name,
            Address = address,
            City = city,
            Region = region,
            PhoneNumber = phone,
            Email = email,
            ManagerName = managerName
        };
    }

    public void Update(string name, string address, string city, string region, string phone, string? email, string? managerName)
    {
        Name = name;
        Address = address;
        City = city;
        Region = region;
        PhoneNumber = phone;
        Email = email;
        ManagerName = managerName;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
