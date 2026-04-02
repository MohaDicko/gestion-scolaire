using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Infrastructure.Services;

/// <summary>
/// Extracts TenantId and UserId from the current HTTP request's JWT claims.
/// The TenantId claim is set during JWT generation at login.
/// SuperAdmin requests include a X-Tenant-ID header to impersonate a school.
/// </summary>
public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetCurrentTenantId()
    {
        var context = _httpContextAccessor.HttpContext;

        // Only SuperAdmin can impersonate a tenant via the X-Tenant-ID header
        var isSuperAdmin = context?.User?.IsInRole("SuperAdmin") ?? false;
        if (isSuperAdmin)
        {
            var headerTenant = context?.Request.Headers["X-Tenant-ID"].FirstOrDefault();
            if (!string.IsNullOrEmpty(headerTenant) && Guid.TryParse(headerTenant, out var headerGuid))
                return headerGuid;
        }

        // Extract TenantId from JWT claim (all other users)
        var tenantClaim = context?.User?.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var tenantGuid))
            return tenantGuid;

        // Return empty Guid for unauthenticated contexts (migrations, seeder, etc.)
        return Guid.Empty;
    }

    public string GetCurrentUserId()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? "system";
    }
}
