using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.Payroll.Commands.ProcessMonthlyPayroll;
using SchoolERP.Application.Payroll.Queries.GetPayrollRuns;
using SchoolERP.Application.Payroll.Queries.GetPayslipsByRun;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,SchoolAdmin,HR_Manager,Accountant")]
public class PayrollController : ControllerBase
{
    private readonly IMediator _mediator;

    public PayrollController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all payroll run batches.
    /// </summary>
    [HttpGet("runs")]
    public async Task<IActionResult> GetPayrollRuns()
    {
        var runs = await _mediator.Send(new GetPayrollRunsQuery());
        return Ok(runs);
    }

    /// <summary>
    /// Get all payslips generated for a specific run.
    /// </summary>
    [HttpGet("runs/{runId}/payslips")]
    public async Task<IActionResult> GetPayslipsByRun(Guid runId)
    {
        var payslips = await _mediator.Send(new GetPayslipsByRunQuery(runId));
        return Ok(payslips);
    }

    /// <summary>
    /// Generate draft payslips for all active employees for a given month.
    /// </summary>
    [HttpPost("runs/generate")]
    public async Task<IActionResult> GenerateMonthlyPayroll([FromBody] GeneratePayrollRequest request)
    {
        var runId = await _mediator.Send(new ProcessMonthlyPayrollCommand(request.Month, request.Year));
        return Ok(new { RunId = runId });
    }
}

public record GeneratePayrollRequest(int Month, int Year);
