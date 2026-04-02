using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Daily attendance record for a student.
/// </summary>
public class Attendance : TenantEntity
{
    public Guid StudentId { get; private set; }
    public Guid ClassroomId { get; private set; }
    public DateTime Date { get; private set; }
    public AttendanceStatus Status { get; private set; }
    public string Remarks { get; private set; } = string.Empty;

    // Navigation
    public Student? Student { get; private set; }
    public Classroom? Classroom { get; private set; }

    private Attendance() { }

    public static Attendance Create(
        Guid tenantId,
        Guid studentId,
        Guid classroomId,
        DateTime date,
        AttendanceStatus status,
        string remarks = "")
    {
        return new Attendance
        {
            TenantId = tenantId,
            StudentId = studentId,
            ClassroomId = classroomId,
            Date = date.Date, // Store only the date part logically
            Status = status,
            Remarks = remarks
        };
    }

    public void UpdateStatus(AttendanceStatus newStatus, string newRemarks)
    {
        Status = newStatus;
        Remarks = newRemarks;
    }
}
