using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Finance;

public enum ExpenseCategory
{
    Maintenance = 1,
    Utilities = 2,
    OfficeSupplies = 3,
    Equipment = 4,
    Events = 5,
    Miscellaneous = 99
}

public class Expense : AuditableEntity
{
    public Guid TenantId { get; private set; }
    
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public DateTime DateIncurred { get; private set; }
    public ExpenseCategory Category { get; private set; }
    public string? ReferenceNumber { get; private set; } // Invoice/Receipt #

    private Expense() { }

    public static Expense Create(
        Guid tenantId,
        string description,
        decimal amount,
        DateTime dateIncurred,
        ExpenseCategory category,
        string? referenceNumber)
    {
        return new Expense
        {
            TenantId = tenantId,
            Description = description,
            Amount = amount,
            DateIncurred = dateIncurred,
            Category = category,
            ReferenceNumber = referenceNumber
        };
    }
}
