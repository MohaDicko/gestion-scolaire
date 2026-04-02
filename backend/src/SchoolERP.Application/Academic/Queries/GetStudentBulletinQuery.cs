using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Application.Academic.Queries.GetStudentBulletin;

public record StudentBulletinDto
{
    public string StudentName { get; init; } = string.Empty;
    public string ClassName { get; init; } = string.Empty;
    public string AcademicYear { get; init; } = string.Empty;
    public int Semester { get; init; }
    public decimal AverageGrade { get; init; }
    public string ParentPhone { get; init; } = string.Empty;
    public List<SubjectGradeDto> Subjects { get; init; } = new();
}

public record SubjectGradeDto(string SubjectName, decimal Score, decimal MaxScore, string Comment);

public record GetStudentBulletinQuery(Guid StudentId, int Semester) : IRequest<StudentBulletinDto>;

public class GetStudentBulletinQueryHandler : IRequestHandler<GetStudentBulletinQuery, StudentBulletinDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public GetStudentBulletinQueryHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<StudentBulletinDto> Handle(GetStudentBulletinQuery request, CancellationToken cancellationToken)
    {
        var dbContent = (DbContext)_unitOfWork;
        
        var student = await dbContent.Set<SchoolERP.Domain.Academic.Student>()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken);
            
        if (student == null) throw new Exception("Student not found");

        var enrollment = await dbContent.Set<SchoolERP.Domain.Academic.Enrollment>()
            .Include(e => e.Classroom)
            .Include(e => e.AcademicYear)
            .FirstOrDefaultAsync(e => e.StudentId == request.StudentId
                                   && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (enrollment == null) throw new SchoolERP.Domain.Exceptions.NotFoundException("Enrollment", request.StudentId);

        var grades = await dbContent.Set<SchoolERP.Domain.Academic.Grade>()
            .Include(g => g.Subject)
            .Where(g => g.StudentId == request.StudentId
                     && g.Semester == request.Semester
                     && g.AcademicYearId == enrollment.AcademicYearId)
            .ToListAsync(cancellationToken);

        var subjects = grades.Select(g => new SubjectGradeDto(
            g.Subject?.Name ?? "Unknown", 
            g.Score, 
            g.MaxScore, 
            g.Comment ?? ""
        )).ToList();

        decimal totalWeightedScore = 0;
        decimal totalCoefficients = 0;

        foreach (var grade in grades)
        {
            var coef = grade.Subject?.Coefficient ?? 1;
            // Normalize score to 20 base Scale
            var normalizedScore = grade.Score * 20 / grade.MaxScore;
            totalWeightedScore += normalizedScore * coef;
            totalCoefficients += coef;
        }

        var average = totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;

        return new StudentBulletinDto
        {
            StudentName = student.FullName,
            ClassName = enrollment.Classroom?.Name ?? "N/A",
            AcademicYear = enrollment.AcademicYear?.Name ?? "N/A",
            Semester = request.Semester,
            AverageGrade = Math.Round(average, 2),
            ParentPhone = student.ParentPhone,
            Subjects = subjects
        };
    }
}
