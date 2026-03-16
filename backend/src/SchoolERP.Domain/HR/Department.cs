using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.HR;

public class Department : TenantEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    private Department() { }

    public static Department Create(Guid tenantId, string name, string code, string? description = null)
    {
        return new Department
        {
            TenantId = tenantId,
            Name = name,
            Code = code,
            Description = description
        };
    }
}
