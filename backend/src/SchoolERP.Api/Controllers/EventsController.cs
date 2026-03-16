using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.Events.Commands;
using SchoolERP.Application.Events.Queries;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EventsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery] int? year, [FromQuery] int? month)
    {
        var result = await _mediator.Send(new GetEventsQuery(year, month));
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(new { id });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        await _mediator.Send(new DeleteEventCommand(id));
        return NoContent();
    }
}
