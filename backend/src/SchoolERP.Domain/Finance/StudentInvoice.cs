using SchoolERP.Domain.Common;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Finance;

/// <summary>
/// Represents a fee, invoice or contribution for a student (e.g. Tuition, School Bus, Uniform)
/// </summary>
public class StudentInvoice : AuditableEntity
{
    public Guid TenantId { get; private set; }
    public Guid StudentId { get; private set; }
    public Guid AcademicYearId { get; private set; }
    
    public string InvoiceNumber { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public FeeType FeeType { get; private set; }
    public InvoiceStatus Status { get; private set; }
    public DateTime DueDate { get; private set; }

    // Navigation
    public Student? Student { get; private set; }
    public AcademicYear? AcademicYear { get; private set; }

    private readonly List<StudentPayment> _payments = new();
    public IReadOnlyCollection<StudentPayment> Payments => _payments.AsReadOnly();

    private StudentInvoice() { }

    public static StudentInvoice Create(
        Guid tenantId,
        Guid studentId,
        Guid academicYearId,
        string description,
        decimal amount,
        FeeType feeType,
        DateTime dueDate)
    {
        return new StudentInvoice
        {
            TenantId = tenantId,
            StudentId = studentId,
            AcademicYearId = academicYearId,
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
            Description = description,
            Amount = amount,
            FeeType = feeType,
            Status = InvoiceStatus.Unpaid,
            DueDate = dueDate
        };
    }

    public void AddPayment(StudentPayment payment)
    {
        _payments.Add(payment);
        UpdateStatus();
    }

    private void UpdateStatus()
    {
        var totalPaid = _payments.Sum(p => p.Amount);
        if (totalPaid >= Amount)
        {
            Status = InvoiceStatus.Paid;
        }
        else if (totalPaid > 0)
        {
            Status = InvoiceStatus.PartiallyPaid;
        }
        else
        {
            Status = InvoiceStatus.Unpaid;
        }
    }
}
