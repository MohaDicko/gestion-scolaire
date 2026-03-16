using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Payroll;

/// <summary>
/// A PayrollRun represents a payroll processing batch for a given month/year.
/// Status: Draft → Processing → Finalized
/// </summary>
public class PayrollRun : TenantEntity
{
    public int Month { get; private set; }
    public int Year { get; private set; }
    public string Period => $"{Year}-{Month:D2}";
    public DateTime RunDate { get; private set; }
    public PayrollRunStatus Status { get; private set; }
    public Guid ProcessedById { get; private set; }

    private readonly List<Payslip> _payslips = new();
    public IReadOnlyCollection<Payslip> Payslips => _payslips.AsReadOnly();

    private PayrollRun() { }

    public static PayrollRun Create(Guid tenantId, int month, int year, Guid processedById)
    {
        return new PayrollRun
        {
            TenantId = tenantId,
            Month = month,
            Year = year,
            RunDate = DateTime.UtcNow,
            ProcessedById = processedById,
            Status = PayrollRunStatus.Draft
        };
    }

    public void FinalizeRun() => Status = PayrollRunStatus.Finalized;
}
