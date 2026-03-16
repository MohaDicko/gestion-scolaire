using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.Finance.Commands.GenerateInvoice;
using SchoolERP.Application.Finance.Commands.PayInvoice;
using SchoolERP.Application.Finance.Queries.GetInvoices;
using SchoolERP.Application.Finance.Queries.GetPayments;
using SchoolERP.Application.Finance.Commands.RecordExpense;
using SchoolERP.Application.Finance.Queries.GetExpenses;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,SchoolAdmin,Accountant")]
public class FinanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public FinanceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] bool onlyWithArrears = false)
    {
        var invoices = await _mediator.Send(new GetInvoicesQuery(onlyWithArrears));
        return Ok(invoices);
    }

    /// <summary>
    /// Generate an invoice for tuition or other fees.
    /// Accessible by: Accountant, SchoolAdmin, SuperAdmin
    /// </summary>
    [HttpPost("invoices")]
    public async Task<IActionResult> GenerateInvoice([FromBody] GenerateStudentInvoiceCommand request)
    {
        var invoiceId = await _mediator.Send(request);
        return Ok(new { InvoiceId = invoiceId });
    }

    /// <summary>
    /// Generate invoices for all students in a classroom.
    /// Accessible by: Accountant, SchoolAdmin, SuperAdmin
    /// </summary>
    [HttpPost("classrooms/{classroomId}/invoices")]
    public async Task<IActionResult> GenerateClassInvoices(Guid classroomId, [FromBody] GenerateClassInvoicesRequest request)
    {
        var command = new SchoolERP.Application.Finance.Commands.GenerateClassInvoices.GenerateClassInvoicesCommand(
            classroomId, request.AcademicYearId, request.Description, request.Amount, request.FeeType, request.DueDate);
        var count = await _mediator.Send(command);
        return Ok(new { InvoicesGenerated = count });
    }

    /// <summary>
    /// Register a payment against an invoice.
    /// </summary>
    [HttpPost("invoices/{invoiceId}/pay")]
    public async Task<IActionResult> PayInvoice(Guid invoiceId, [FromBody] PayInvoiceRequest request)
    {
        var command = new PayStudentInvoiceCommand(invoiceId, request.Amount, request.PaymentMethod, request.ReferenceNumber);
        var paymentId = await _mediator.Send(command);
        return Ok(new { PaymentId = paymentId });
    }

    /// <summary>
    /// Get all invoices for a specific student.
    /// Accessible by: Accountant, SchoolAdmin, SuperAdmin, Student (their own)
    /// </summary>
    [HttpGet("students/{studentId}/invoices")]
    public async Task<IActionResult> GetStudentInvoices(Guid studentId)
    {
        var query = new SchoolERP.Application.Finance.Queries.GetStudentInvoices.GetStudentInvoicesQuery(studentId);
        var invoices = await _mediator.Send(query);
        return Ok(invoices);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _mediator.Send(new GetPaymentsQuery());
        return Ok(payments);
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> GetExpenses()
    {
        var expenses = await _mediator.Send(new GetExpensesQuery());
        return Ok(expenses);
    }

    [HttpPost("expenses")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin,Accountant")]
    public async Task<IActionResult> RecordExpense([FromBody] RecordExpenseCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(new { id = result });
    }
}

public record PayInvoiceRequest(decimal Amount, string PaymentMethod, string ReferenceNumber);

public record GenerateClassInvoicesRequest(
    Guid AcademicYearId,
    string Description,
    decimal Amount,
    FeeType FeeType,
    DateTime DueDate);
