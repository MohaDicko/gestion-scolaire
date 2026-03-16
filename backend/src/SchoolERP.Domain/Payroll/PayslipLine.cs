using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Payroll;

/// <summary>
/// A single line item on a payslip (e.g., "Housing Allowance: +50,000 XOF").
/// </summary>
public class PayslipLine : BaseEntity
{
    public Guid PayslipId { get; private set; }
    public string Label { get; private set; } = string.Empty;
    public SalaryElementType ElementType { get; private set; } // Allowance or Deduction
    public decimal Amount { get; private set; }

    private PayslipLine() { }

    public static PayslipLine Create(Guid payslipId, string label, SalaryElementType elementType, decimal amount)
    {
        return new PayslipLine
        {
            PayslipId = payslipId,
            Label = label,
            ElementType = elementType,
            Amount = amount
        };
    }
}
