using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace SchoolERP.Api.Controllers;

/// <summary>
/// Authentication controller — handles login and token generation.
/// NOTE: This is a DEMO implementation for development.
/// Replace with real user lookup + password hash verification in production.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;

    public AuthController(IConfiguration config)
    {
        _config = config;
    }

    public record LoginRequest(string Email, string Password);
    public record LoginResponse(string AccessToken, UserDto User);
    public record UserDto(
        string Id, string Email, string FirstName, string LastName,
        string Role, string TenantId, string SchoolName);

    // ── Demo accounts ─────────────────────────────────────────────────────
    private static readonly dynamic[] DemoAccounts = new dynamic[]
    {
        new { Email = "admin@school.com",     Password = "Admin@1234", Role = "SchoolAdmin",  FirstName = "Admin",   LastName = "Principal", School = "Lycée Bamako", TenantId = "a1b2c3d4-0000-0000-0000-000000000001" },
        new { Email = "rh@school.com",        Password = "Admin@1234", Role = "HR_Manager",   FirstName = "Fatou",   LastName = "Koné",      School = "Lycée Bamako", TenantId = "a1b2c3d4-0000-0000-0000-000000000001" },
        new { Email = "prof@school.com",      Password = "Admin@1234", Role = "Teacher",      FirstName = "Ibrahim", LastName = "Diallo",    School = "Lycée Bamako", TenantId = "a1b2c3d4-0000-0000-0000-000000000001" },
        new { Email = "comptable@school.com", Password = "Admin@1234", Role = "Accountant",   FirstName = "Marie",   LastName = "Traore",    School = "Lycée Bamako", TenantId = "a1b2c3d4-0000-0000-0000-000000000001" },
        new { Email = "eleve@school.com",     Password = "Admin@1234", Role = "Student",      FirstName = "Eleve",   LastName = "Demo",      School = "Lycée Bamako", TenantId = "a1b2c3d4-0000-0000-0000-000000000001" },
        new { Email = "super@schoolerp.com",  Password = "Super@1234", Role = "SuperAdmin",   FirstName = "Super",   LastName = "Admin",     School = "SchoolERP HQ", TenantId = "00000000-0000-0000-0000-000000000000" },
    };

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        dynamic? account = null;
        foreach (var a in DemoAccounts)
        {
            if (string.Equals((string)a.Email, request.Email, StringComparison.OrdinalIgnoreCase)
             && (string)a.Password == request.Password)
            {
                account = a;
                break;
            }
        }

        if (account is null)
            return Unauthorized(new { Message = "Email ou mot de passe incorrect." });

        var token = GenerateJwtToken(account.Email, account.Role, account.TenantId,
            $"{account.FirstName} {account.LastName}");

        return Ok(new LoginResponse(
            token,
            new UserDto(
                Guid.NewGuid().ToString(),
                (string)account.Email,
                (string)account.FirstName,
                (string)account.LastName,
                (string)account.Role,
                (string)account.TenantId,
                (string)account.School
            )
        ));
    }

    [HttpGet("users")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public IActionResult GetUsers()
    {
        var users = new[]
        {
            new { id = "1", email = "admin@school.com",     firstName = "Admin",   lastName = "Principal", role = "SchoolAdmin",  isActive = true,  lastLogin = DateTime.Now.AddHours(-2).ToString("o") },
            new { id = "2", email = "rh@school.com",        firstName = "Fatou",   lastName = "Koné",      role = "HR_Manager",   isActive = true,  lastLogin = DateTime.Now.AddDays(-1).ToString("o") },
            new { id = "3", email = "prof@school.com",      firstName = "Ibrahim", lastName = "Diallo",    role = "Teacher",      isActive = true,  lastLogin = DateTime.Now.AddDays(-2).ToString("o") },
            new { id = "4", email = "comptable@school.com", firstName = "Marie",   lastName = "Traore",    role = "Accountant",   isActive = true,  lastLogin = DateTime.Now.AddDays(-5).ToString("o") },
            new { id = "5", email = "eleve@school.com",     firstName = "Eleve",   lastName = "Demo",      role = "Student",      isActive = false, lastLogin = DateTime.Now.AddDays(-30).ToString("o") },
            new { id = "0", email = "super@schoolerp.com",  firstName = "Super",   lastName = "Admin",     role = "SuperAdmin",   isActive = true,  lastLogin = DateTime.Now.ToString("o") },
        };
        return Ok(users);
    }

    [HttpPost("logout")]
    public IActionResult Logout() => Ok(new { Message = "Logged out successfully." });

    // ── JWT Generation ────────────────────────────────────────────────────
    private string GenerateJwtToken(string email, string role, string tenantId, string name)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? throw new Exception("JWT Key missing")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()),
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
