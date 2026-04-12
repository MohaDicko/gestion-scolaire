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

    /// <summary>
    /// Generates the standard 3-installment plan for Malian Health Schools.
    /// 40% (Enrollment), 30% (December), 30% (March)
    /// </summary>
    public void GenerateHealthStandardInstallments(decimal totalAmount)
    {
        var currentYear = DateTime.UtcNow.Year;
        
        // 1. Enrollment / Start (40%)
        _installments.Add(PaymentInstallment.Create(TenantId, Id, "Inscription & 1ère Tranche", totalAmount * 0.4m, DateTime.UtcNow));

        // 2. Second Installment (30%) - mid December
        _installments.Add(PaymentInstallment.Create(TenantId, Id, "2ème Tranche", totalAmount * 0.3m, new DateTime(currentYear, 12, 15, 0, 0, 0, DateTimeKind.Utc)));

        // 3. Third Installment (30%) - mid March next year
        _installments.Add(PaymentInstallment.Create(TenantId, Id, "3ème Tranche (Solde)", totalAmount * 0.3m, new DateTime(currentYear + 1, 3, 15, 0, 0, 0, DateTimeKind.Utc)));
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
