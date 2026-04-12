using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Infrastructure.Persistence;
using SchoolERP.Application.Common.Interfaces;
using Microsoft.AspNetCore.RateLimiting;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("strict")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public AuthController(IConfiguration config, AppDbContext db, IPasswordHasher passwordHasher)
    {
        _config = config;
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public record LoginRequest(string Email, string Password);
    public record LoginResponse(string AccessToken, UserDto User);
    public record UserDto(
        string Id, string Email, string FirstName, string LastName,
        string Role, string TenantId, string SchoolName);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users
            .IgnoreQueryFilters() // Auth is cross-tenant
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower().Trim());

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized(new { Message = "Email ou mot de passe incorrect." });

        if (!user.IsActive)
            return Unauthorized(new { Message = "Ce compte est désactivé." });

        user.RecordLogin();
        
        // Generate Token
        var token = GenerateJwtToken(user.Id.ToString(), user.Email, user.Role.ToString(), user.TenantId.ToString(), $"{user.FirstName} {user.LastName}");
        
        // Generate Refresh Token
        var refreshToken = Guid.NewGuid().ToString().Replace("-", "");
        user.AddRefreshToken(refreshToken, DateTime.UtcNow.AddDays(7), HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0");
        
        await _db.SaveChangesAsync();

        // Set refresh token in HttpOnly cookie
        SetRefreshTokenCookie(refreshToken);

        return Ok(new LoginResponse(
            token,
            new UserDto(
                user.Id.ToString(),
                user.Email,
                user.FirstName,
                user.LastName,
                user.Role.ToString(),
                user.TenantId.ToString(),
                "" // School name could be joined if needed
            )
        ));
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
        var cookieToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(cookieToken)) return Unauthorized();

        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == cookieToken && t.RevokedAt == null));

        if (user == null) return Unauthorized();

        var existingToken = user.RefreshTokens.First(t => t.Token == cookieToken);
        if (!existingToken.IsActive) return Unauthorized();

        // Rotate Refresh Token
        var newRefreshToken = Guid.NewGuid().ToString().Replace("-", "");
        user.RevokeRefreshToken(cookieToken, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0", "Replaced by new token");
        user.AddRefreshToken(newRefreshToken, DateTime.UtcNow.AddDays(7), HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0");
        
        await _db.SaveChangesAsync();
        SetRefreshTokenCookie(newRefreshToken);

        var token = GenerateJwtToken(user.Id.ToString(), user.Email, user.Role.ToString(), user.TenantId.ToString(), $"{user.FirstName} {user.LastName}");

        return Ok(new { AccessToken = token });
    }

    private void SetRefreshTokenCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            Secure = true, // Force secure in prod
            SameSite = SameSiteMode.Strict
        };
        Response.Cookies.Append("refreshToken", token, cookieOptions);
    }

    [HttpGet("users")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .Select(u => new {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                Role = u.Role.ToString(),
                u.IsActive,
                LastLogin = u.LastLoginAt
            })
            .ToListAsync();
        
        return Ok(users);
    }

    [HttpPost("logout")]
    public IActionResult Logout() => Ok(new { Message = "Logged out successfully." });

    // ── JWT Generation ────────────────────────────────────────────────────
    private string GenerateJwtToken(string userId, string email, string role, string tenantId, string name)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? throw new Exception("JWT Key missing")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim("tenantId", tenantId),
            new Claim("name", name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var expiration = int.TryParse(_config["Jwt:AccessTokenExpirationMinutes"], out var min) ? min : 60;

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiration),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}
