using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.Dashboard.Queries;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _mediator.Send(new GetDashboardStatsQuery());
        return Ok(stats);
    }

    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformance()
    {
        var performance = await _mediator.Send(new GetFinancialPerformanceQuery());
        return Ok(performance);
    }
}
