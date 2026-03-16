using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.Ai.Queries.AskAssistant;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All school roles can usually interact with the Assistant for their scope.
public class AiController : ControllerBase
{
    private readonly IMediator _mediator;

    public AiController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Ask a question to the School Assistant in natural language.
    /// Accessible by: ANY authenticated user.
    /// </summary>
    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AskAiRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Prompt))
            return BadRequest("Please provide a prompt.");

        var query = new AskAssistantQuery(request.Prompt);
        var response = await _mediator.Send(query);
        return Ok(response);
    }

    /// <summary>
    /// Semantic Search across the ERP database.
    /// (To be expanded)
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query)
    {
        // Simple keywords routing logic
        var result = await _mediator.Send(new AskAssistantQuery(query));
        return Ok(result);
    }
}

public record AskAiRequest(string Prompt);
