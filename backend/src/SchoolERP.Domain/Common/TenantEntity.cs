namespace SchoolERP.Domain.Common;

public abstract class TenantEntity : AuditableEntity
{
    public Guid TenantId { get; protected set; }

    protected TenantEntity() { }

    protected TenantEntity(Guid tenantId)
    {
        TenantId = tenantId;
    }
}
