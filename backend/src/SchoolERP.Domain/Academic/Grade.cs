using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a student's grade for a specific subject and exam.
/// This entity is auditable because grades can never be changed without a trace.
/// </summary>
public class Grade : AuditableEntity
{
    public Guid TenantId { get; private set; }
    public Guid StudentId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid AcademicYearId { get; private set; }
    public decimal Score { get; private set; }          // e.g. 14.5 out of 20
    public decimal MaxScore { get; private set; }       // e.g. 20
    public int Semester { get; private set; }           // 1, 2 or 3 (Trimestres or Semestres)
    public ExamType ExamType { get; private set; }      // Midterm, Final, Continuous
    public string? Comment { get; private set; }

    // Navigation
    public Student? Student { get; private set; }
    public Subject? Subject { get; private set; }

    private Grade() { }

    public static Grade Create(
        Guid tenantId,
        Guid studentId,
        Guid subjectId,
        Guid academicYearId,
        decimal score,
        decimal maxScore,
        int semester,
        ExamType examType,
        string? comment = null)
    {
        return new Grade
        {
            TenantId = tenantId,
            StudentId = studentId,
            SubjectId = subjectId,
            AcademicYearId = academicYearId,
            Score = score,
            MaxScore = maxScore,
            Semester = semester,
            ExamType = examType,
            Comment = comment
        };
    }

    public void Correct(decimal newScore, string? comment)
    {
        Score = newScore;
        Comment = comment;
        // The audit trail (LastModifiedAt, LastModifiedBy) is handled by AppDbContext
    }
}
