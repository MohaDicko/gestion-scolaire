using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Finance.Commands.PayInvoice;

public record PayStudentInvoiceCommand(
    Guid InvoiceId,
    decimal Amount,
    string PaymentMethod,
    string ReferenceNumber) : IRequest<Guid>;

public class PayStudentInvoiceCommandHandler : IRequestHandler<PayStudentInvoiceCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public PayStudentInvoiceCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(PayStudentInvoiceCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        var invoice = await db.Set<StudentInvoice>()
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId, cancellationToken);
            
        if (invoice == null) throw new Exception("Invoice not found");

        var payment = StudentPayment.Create(
            tenantId,
            request.InvoiceId,
            request.Amount,
            request.PaymentMethod,
            request.ReferenceNumber
        );

        invoice.AddPayment(payment);

        await db.AddAsync(payment, cancellationToken);
        // Note: Invoice status is updated inside 'AddPayment', so EF Core ChangeTracker will track it.
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return payment.Id;
    }
}
