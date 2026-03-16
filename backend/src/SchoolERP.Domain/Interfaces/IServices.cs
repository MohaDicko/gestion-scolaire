namespace SchoolERP.Domain.Interfaces;

/// <summary>
/// Unit of Work — wraps DbContext.SaveChangesAsync to coordinate multiple repositories.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Service to extract the current TenantId from the JWT / HTTP context.
/// </summary>
public interface ITenantService
{
    Guid GetCurrentTenantId();
    string GetCurrentUserId();
}
