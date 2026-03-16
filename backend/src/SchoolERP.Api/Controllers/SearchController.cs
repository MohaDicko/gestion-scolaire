using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.Search.Queries;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly IMediator _mediator;
    public SearchController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var result = await _mediator.Send(new GlobalSearchQuery(q ?? ""));
        return Ok(result);
    }
}
