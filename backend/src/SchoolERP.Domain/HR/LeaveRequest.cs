using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Domain.HR;

/// <summary>
/// Leave request submitted by an employee.
/// Supports a workflow: Pending → Approved | Rejected.
/// </summary>
public class LeaveRequest : TenantEntity
{
    public Guid EmployeeId { get; private set; }
    public LeaveType LeaveType { get; private set; }    // Annual, Sick, Maternity, Unpaid
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public int TotalDays => (EndDate - StartDate).Days + 1;
    public string Reason { get; private set; } = string.Empty;
    public LeaveStatus Status { get; private set; }
    public Guid? ApprovedById { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public string? RejectionReason { get; private set; }

    // Navigation
    public Employee? Employee { get; private set; }

    private LeaveRequest() { }

    public static LeaveRequest Submit(
        Guid tenantId, Guid employeeId,
        LeaveType leaveType, DateTime startDate, DateTime endDate, string reason)
    {
        if (endDate < startDate)
            throw new DomainException("Leave end date cannot be before start date.");

        return new LeaveRequest
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            LeaveType = leaveType,
            StartDate = startDate,
            EndDate = endDate,
            Reason = reason,
            Status = LeaveStatus.Pending
        };
    }

    public Result Approve(Guid approvedById)
    {
        if (Status != LeaveStatus.Pending)
            return Result.Failure("Only pending leave requests can be approved.");

        Status = LeaveStatus.Approved;
        ApprovedById = approvedById;
        ApprovedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Reject(Guid rejectedById, string reason)
    {
        if (Status != LeaveStatus.Pending)
            return Result.Failure("Only pending leave requests can be rejected.");

        Status = LeaveStatus.Rejected;
        ApprovedById = rejectedById;
        RejectionReason = reason;
        return Result.Success();
    }
}
