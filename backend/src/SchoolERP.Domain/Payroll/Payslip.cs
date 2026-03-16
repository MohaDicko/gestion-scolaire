using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Domain.Payroll;

/// <summary>
/// A payslip is IMMUTABLE once finalized.
/// This is a core business rule — a finalized payslip represents a legal document.
/// Any attempt to modify a finalized payslip throws a DomainException.
/// </summary>
public class Payslip : AuditableEntity
{
    public Guid TenantId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public Guid PayrollRunId { get; private set; }

    // Salary breakdown (snapshot at the time of generation)
    public decimal GrossSalary { get; private set; }
    public decimal TotalAllowances { get; private set; }
    public decimal TotalDeductions { get; private set; }
    public decimal NetSalary { get; private set; }
    public string Currency { get; private set; } = "XOF";

    // Period covered
    public int Month { get; private set; }  // 1–12
    public int Year { get; private set; }

    public PayslipStatus Status { get; private set; }

    // Navigation
    public HR.Employee? Employee { get; private set; }
    public PayrollRun? PayrollRun { get; private set; }

    private readonly List<PayslipLine> _lines = new();
    public IReadOnlyCollection<PayslipLine> Lines => _lines.AsReadOnly();

    private Payslip() { }

    public static Payslip Create(
        Guid tenantId,
        Guid employeeId,
        Guid payrollRunId,
        decimal grossSalary,
        decimal totalAllowances,
        decimal totalDeductions,
        int month,
        int year,
        string currency = "XOF")
    {
        return new Payslip
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            PayrollRunId = payrollRunId,
            GrossSalary = grossSalary,
            TotalAllowances = totalAllowances,
            TotalDeductions = totalDeductions,
            NetSalary = grossSalary + totalAllowances - totalDeductions,
            Month = month,
            Year = year,
            Currency = currency,
            Status = PayslipStatus.Draft
        };
    }

    /// <summary>
    /// Finalize the payslip — after this, the payslip becomes IMMUTABLE.
    /// </summary>
    public Result Finalize()
    {
        if (Status == PayslipStatus.Finalized)
            return Result.Failure("Payslip is already finalized.");

        Status = PayslipStatus.Finalized;
        return Result.Success();
    }

    public void AddLine(string label, SalaryElementType elementType, decimal amount)
    {
        EnsureNotFinalized();

        var line = PayslipLine.Create(Id, label, elementType, amount);
        _lines.Add(line);

        if (elementType == SalaryElementType.Allowance)
            TotalAllowances += amount;
        else if (elementType == SalaryElementType.Deduction)
            TotalDeductions += amount;

        NetSalary = GrossSalary + TotalAllowances - TotalDeductions;
    }

    /// <summary>
    /// Guard method — called by the domain before any property change.
    /// </summary>
    private void EnsureNotFinalized()
    {
        if (Status == PayslipStatus.Finalized)
            throw new DomainException("A finalized payslip is immutable and cannot be modified.");
    }
}
