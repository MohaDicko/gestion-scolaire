using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Auth;

public class User : TenantEntity
{
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime? LastLoginAt { get; private set; }

    private readonly List<RefreshToken> _refreshTokens = new();
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    private User() { }

    public static User Create(
        Guid tenantId,
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        UserRole role,
        string phone = "")
    {
        return new User
        {
            TenantId = tenantId,
            Email = email.ToLower().Trim(),
            PasswordHash = passwordHash,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            Phone = phone,
            IsActive = true
        };
    }

    public void UpdateProfile(string firstName, string lastName, string phone)
    {
        FirstName = firstName;
        LastName = lastName;
        Phone = phone;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }

    public void UpdateRole(UserRole newRole) => Role = newRole;
    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
    public void RecordLogin() => LastLoginAt = DateTime.UtcNow;

    public void AddRefreshToken(string token, DateTime expiresAt, string createdByIp)
    {
        // Remove old/expired tokens to keep the list clean
        _refreshTokens.RemoveAll(t => t.ExpiresAt <= DateTime.UtcNow || t.RevokedAt != null);
        
        _refreshTokens.Add(new RefreshToken(token, expiresAt, createdByIp));
    }

    public void RevokeRefreshToken(string token, string revokedByIp, string reason)
    {
        var rt = _refreshTokens.SingleOrDefault(t => t.Token == token);
        if (rt != null)
        {
            rt.Revoke(revokedByIp, reason);
        }
    }
}

// RefreshToken class moved to separate file
