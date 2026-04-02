using SchoolERP.Domain.Common;
using SchoolERP.Domain.Exceptions;
using SchoolERP.Domain.HR;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// A single scheduled lesson for a classroom on a specific day of the week.
/// </summary>
public class ClassSchedule : TenantEntity
{
    public Guid ClassroomId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid TeacherId { get; private set; }
    
    public DayOfWeek DayOfWeek { get; private set; }
    public TimeSpan StartTime { get; private set; }
    public TimeSpan EndTime { get; private set; }

    // Navigation
    public Classroom? Classroom { get; private set; }
    public Subject? Subject { get; private set; }
    public Employee? Teacher { get; private set; }

    private ClassSchedule() { }

    public static ClassSchedule Create(
        Guid tenantId,
        Guid classroomId,
        Guid subjectId,
        Guid teacherId,
        DayOfWeek dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime)
    {
        if (startTime >= endTime)
            throw new DomainException("Start time must be before end time.");

        return new ClassSchedule
        {
            TenantId = tenantId,
            ClassroomId = classroomId,
            SubjectId = subjectId,
            TeacherId = teacherId,
            DayOfWeek = dayOfWeek,
            StartTime = startTime,
            EndTime = endTime
        };
    }
}
