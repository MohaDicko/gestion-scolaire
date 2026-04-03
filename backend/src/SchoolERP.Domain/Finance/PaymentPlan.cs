using SchoolERP.Domain.Common;
using SchoolERP.Domain.Academic;

namespace SchoolERP.Domain.Finance;

/// <summary>
/// Represents a specific payment plan for a student's tuition.
/// Defines how the total tuition fee is split into installments (tranches).
/// </summary>
public class PaymentPlan : TenantEntity
{
    public Guid StudentId { get; private set; }
    public Guid AcademicYearId { get; private set; }
    public string Name { get; private set; } = string.Empty; // e.g. "Standard Plan", "Monthly Plan"
    public decimal TotalAmount { get; private set; }
    
    // Navigation
    public Student? Student { get; private set; }
    public AcademicYear? AcademicYear { get; private set; }

    private readonly List<PaymentInstallment> _installments = new();
    public IReadOnlyCollection<PaymentInstallment> Installments => _installments.AsReadOnly();

    private PaymentPlan() { }

    public static PaymentPlan Create(Guid tenantId, Guid studentId, Guid academicYearId, string name, decimal totalAmount)
    {
        return new PaymentPlan
        {
            TenantId = tenantId,
            StudentId = studentId,
            AcademicYearId = academicYearId,
            Name = name,
            TotalAmount = totalAmount
        };
    }

    public void AddInstallment(string label, decimal amount, DateTime dueDate)
    {
        _installments.Add(PaymentInstallment.Create(TenantId, Id, label, amount, dueDate));
    }
}

public class PaymentInstallment : TenantEntity
{
    public Guid PaymentPlanId { get; private set; }
    public string Label { get; private set; } = string.Empty; // e.g. "1ère Tranche", "Octobre"
    public decimal Amount { get; private set; }
    public DateTime DueDate { get; private set; }
    public bool IsPaid { get; private set; } = false;

    private PaymentInstallment() { }

    public static PaymentInstallment Create(Guid tenantId, Guid planId, string label, decimal amount, DateTime dueDate)
    {
        return new PaymentInstallment
        {
            TenantId = tenantId,
            PaymentPlanId = planId,
            Label = label,
            Amount = amount,
            DueDate = dueDate.Date
        };
    }

    public void MarkAsPaid() => IsPaid = true;
    public void UnmarkAsPaid() => IsPaid = false;
}
