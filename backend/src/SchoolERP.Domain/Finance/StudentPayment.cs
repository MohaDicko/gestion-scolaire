using SchoolERP.Domain.Common;

namespace SchoolERP.Domain.Finance;

/// <summary>
/// Represents a payment made against a student invoice.
/// </summary>
public class StudentPayment : AuditableEntity
{
    public Guid TenantId { get; private set; }
    public Guid InvoiceId { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaymentDate { get; private set; }
    public string PaymentMethod { get; private set; } = string.Empty; // Cash, Bank Transfer, Mobile Money
    public string ReferenceNumber { get; private set; } = string.Empty;

    public StudentInvoice? Invoice { get; private set; }

    private StudentPayment() { }

    public static StudentPayment Create(
        Guid tenantId,
        Guid invoiceId,
        decimal amount,
        string paymentMethod,
        string referenceNumber)
    {
        return new StudentPayment
        {
            TenantId = tenantId,
            InvoiceId = invoiceId,
            Amount = amount,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = paymentMethod,
            ReferenceNumber = referenceNumber
        };
    }
}
