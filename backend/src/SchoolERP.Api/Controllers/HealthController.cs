using Microsoft.AspNetCore.Mvc;

namespace SchoolERP.Api.Controllers;

/// <summary>
/// Health check endpoint — useful during development to verify the API is running.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() =>
        Ok(new
        {
            Status = "Healthy",
            Service = "SchoolERP API",
            Version = "1.0.0",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        });
}
