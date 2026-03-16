using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.HR;

/// <summary>
/// Daily attendance record for a staff member (Employee).
/// </summary>
public class StaffAttendance : AuditableEntity
{
    public Guid TenantId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public DateTime Date { get; private set; }
    public StaffAttendanceStatus Status { get; private set; }
    public string Remarks { get; private set; } = string.Empty;
    public DateTime? CheckInTime { get; private set; }
    public DateTime? CheckOutTime { get; private set; }

    // Navigation
    public Employee? Employee { get; private set; }

    private StaffAttendance() { }

    public static StaffAttendance Create(
        Guid tenantId,
        Guid employeeId,
        DateTime date,
        StaffAttendanceStatus status,
        string remarks = "",
        DateTime? checkIn = null,
        DateTime? checkOut = null)
    {
        return new StaffAttendance
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            Date = date.Date,
            Status = status,
            Remarks = remarks,
            CheckInTime = checkIn,
            CheckOutTime = checkOut
        };
    }

    public void Update(StaffAttendanceStatus status, string remarks, DateTime? checkIn, DateTime? checkOut)
    {
        Status = status;
        Remarks = remarks;
        CheckInTime = checkIn;
        CheckOutTime = checkOut;
    }
}

public enum StaffAttendanceStatus
{
    Present = 0,
    Absent = 1,
    Late = 2,
    OnLeave = 3,
    Excused = 4
}
