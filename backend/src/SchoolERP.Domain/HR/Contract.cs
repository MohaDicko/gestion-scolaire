using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Domain.HR;

/// <summary>
/// Employment contract with temporal logic.
/// Contracts are auditable — every change is tracked.
/// </summary>
public class Contract : TenantEntity
{
    public Guid EmployeeId { get; private set; }
    public ContractType ContractType { get; private set; }  // CDI, CDD, Temporary, Intern
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }          // Null for permanent contracts (CDI)
    public decimal BaseSalary { get; private set; }
    public string Currency { get; private set; } = "XOF";  // Default: West African CFA franc
    public ContractStatus Status { get; private set; }

    // Navigation
    public Employee? Employee { get; private set; }

    private Contract() { }

    public static Contract Create(
        Guid tenantId,
        Guid employeeId,
        ContractType contractType,
        DateTime startDate,
        DateTime? endDate,
        decimal baseSalary,
        string currency = "XOF")
    {
        if (endDate.HasValue && endDate <= startDate)
            throw new DomainException("Contract end date must be after start date.");

        if (contractType == ContractType.CDD && !endDate.HasValue)
            throw new DomainException("A fixed-term contract (CDD) must have an end date.");

        return new Contract
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            ContractType = contractType,
            StartDate = startDate,
            EndDate = endDate,
            BaseSalary = baseSalary,
            Currency = currency,
            Status = ContractStatus.Active
        };
    }

    public Result Renew(DateTime newEndDate, decimal? newBaseSalary = null)
    {
        if (Status != ContractStatus.Active)
            return Result.Failure("Cannot renew an inactive or terminated contract.");

        EndDate = newEndDate;
        if (newBaseSalary.HasValue)
            BaseSalary = newBaseSalary.Value;

        return Result.Success();
    }

    public Result Terminate(DateTime terminationDate)
    {
        if (Status == ContractStatus.Terminated)
            return Result.Failure("Contract is already terminated.");

        EndDate = terminationDate;
        Status = ContractStatus.Terminated;
        return Result.Success();
    }
}
