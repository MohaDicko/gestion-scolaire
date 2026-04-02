using SchoolERP.Application.Common.Interfaces;
using BCryptNet = BCrypt.Net.BCrypt;

namespace SchoolERP.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCryptNet.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        return BCryptNet.Verify(password, hashedPassword);
    }
}
