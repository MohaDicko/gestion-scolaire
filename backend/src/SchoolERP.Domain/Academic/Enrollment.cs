using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Enrollment links a Student to a Classroom for a given AcademicYear.
/// </summary>
public class Enrollment : TenantEntity
{
    public Guid StudentId { get; private set; }
    public Guid ClassroomId { get; private set; }
    public Guid AcademicYearId { get; private set; }
    public EnrollmentStatus Status { get; private set; }
    public DateTime EnrollmentDate { get; private set; }

    // Navigation
    public Student? Student { get; private set; }
    public Classroom? Classroom { get; private set; }
    public AcademicYear? AcademicYear { get; private set; }

    private Enrollment() { }

    public static Enrollment Create(
        Guid tenantId,
        Guid studentId,
        Guid classroomId,
        Guid academicYearId)
    {
        return new Enrollment
        {
            TenantId = tenantId,
            StudentId = studentId,
            ClassroomId = classroomId,
            AcademicYearId = academicYearId,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = DateTime.UtcNow
        };
    }

    public void Transfer(Guid newClassroomId)
    {
        if (Status != EnrollmentStatus.Active)
            throw new DomainException("Cannot transfer a student whose enrollment is not active.");

        ClassroomId = newClassroomId;
    }

    public void Withdraw()
    {
        if (Status == EnrollmentStatus.Withdrawn)
            throw new DomainException("Enrollment is already withdrawn.");

        Status = EnrollmentStatus.Withdrawn;
    }

    public void Promote() => Status = EnrollmentStatus.Promoted;
    public void Repeat() => Status = EnrollmentStatus.Repeated;
}
