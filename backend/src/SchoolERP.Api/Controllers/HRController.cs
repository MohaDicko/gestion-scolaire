using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.HR.Commands.CreateEmployee;
using SchoolERP.Application.HR.Commands.DeactivateEmployee;
using SchoolERP.Application.HR.Commands.UpdateEmployee;
using SchoolERP.Application.HR.Queries.GetEmployees;
using SchoolERP.Application.HR.Commands.CreateContract;
using SchoolERP.Application.HR.Queries.GetContracts;
using SchoolERP.Application.HR.Queries.GetLeaves;
using SchoolERP.Application.HR.Commands.CreateLeaveRequest;
using SchoolERP.Application.HR.Commands.UpdateLeaveStatus;
using SchoolERP.Application.HR.Commands.RecordStaffAttendance;
using SchoolERP.Application.HR.Queries.GetStaffAttendance;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,SchoolAdmin,HR_Manager")]
public class HRController : ControllerBase
{
    private readonly IMediator _mediator;

    public HRController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees([FromQuery] GetEmployeesQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(id);
    }

    [HttpPut("employees/{id}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeCommand command)
    {
        if (id != command.Id) return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("employees/{id}/deactivate")]
    public async Task<IActionResult> DeactivateEmployee(Guid id)
    {
        await _mediator.Send(new DeactivateEmployeeCommand(id));
        return Ok();
    }

    [HttpPost("employees/{id}/activate")]
    public async Task<IActionResult> ActivateEmployee(Guid id)
    {
        await _mediator.Send(new ActivateEmployeeCommand(id));
        return Ok();
    }

    [HttpGet("contracts")]
    public async Task<IActionResult> GetContracts()
    {
        var result = await _mediator.Send(new GetContractsQuery());
        return Ok(result);
    }

    [HttpPost("contracts")]
    public async Task<IActionResult> CreateContract([FromBody] CreateContractCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(id);
    }

    [HttpGet("leaves")]
    public async Task<IActionResult> GetLeaves()
    {
        var result = await _mediator.Send(new GetLeavesQuery());
        return Ok(result);
    }

    [HttpPost("leaves")]
    public async Task<IActionResult> CreateLeaveRequest([FromBody] CreateLeaveRequestCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(id);
    }

    [HttpPut("leaves/{id}/status")]
    public async Task<IActionResult> UpdateLeaveStatus(Guid id, [FromBody] UpdateLeaveStatusCommand command)
    {
        if (id != command.LeaveRequestId) return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }
    
    [HttpGet("attendance")]
    public async Task<IActionResult> GetStaffAttendance([FromQuery] DateTime date)
    {
        var result = await _mediator.Send(new GetStaffAttendanceQuery(date));
        return Ok(result);
    }

    [HttpPost("attendance")]
    public async Task<IActionResult> RecordStaffAttendance([FromBody] RecordStaffAttendanceCommand command)
    {
        await _mediator.Send(command);
        return Ok();
    }
}
