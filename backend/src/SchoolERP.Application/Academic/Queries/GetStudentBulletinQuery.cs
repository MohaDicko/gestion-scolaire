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
    public int Period { get; init; } 
    public decimal TotalPoints { get; init; }
    public decimal TotalCoefficients { get; init; }
    public decimal PeriodAverage { get; init; }
    public decimal TheoryAverage { get; init; }
    public decimal StageAverage { get; init; }
    public string SpecialtyName { get; init; } = string.Empty;
    public string Rank { get; init; } = "N/A";
    public AttendanceSummaryDto Attendance { get; init; } = new();
    public int MaxGrade { get; init; } = 20;
    public List<SubjectResultDto> Subjects { get; init; } = new();
}

public record AttendanceSummaryDto(int Present = 0, int Absent = 0, int Late = 0, int Excused = 0);

public record SubjectResultDto(
    string SubjectName, 
    decimal ClassAverage, 
    decimal ExamScore, 
    decimal Coefficient, 
    decimal FinalAverage, 
    decimal Points, 
    string Appreciation);

public record GetStudentBulletinQuery(Guid StudentId, int Period) : IRequest<StudentBulletinDto>;

public class GetStudentBulletinQueryHandler : IRequestHandler<GetStudentBulletinQuery, StudentBulletinDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStudentBulletinQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StudentBulletinDto> Handle(GetStudentBulletinQuery request, CancellationToken cancellationToken)
    {
        var dbContent = (DbContext)_unitOfWork;
        
        var student = await dbContent.Set<SchoolERP.Domain.Academic.Student>()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken);
        if (student == null) throw new Exception("Student not found");

        var enrollment = await dbContent.Set<SchoolERP.Domain.Academic.Enrollment>()
            .Include(e => e.Classroom)
                .ThenInclude(c => c!.Section)
            .Include(e => e.AcademicYear)
            .FirstOrDefaultAsync(e => e.StudentId == request.StudentId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (enrollment == null) throw new Exception("Active enrollment not found");
        
        int maxGrade = enrollment.Classroom?.Section?.MaxGradeValue ?? 20;

        // 1. Calculate Attendance Stats
        var attendanceRecords = await dbContent.Set<SchoolERP.Domain.Academic.Attendance>()
            .Where(a => a.StudentId == request.StudentId && a.ClassroomId == enrollment.ClassroomId)
            .ToListAsync(cancellationToken);

        var attendanceSummary = new AttendanceSummaryDto(
            attendanceRecords.Count(a => a.Status == AttendanceStatus.Present),
            attendanceRecords.Count(a => a.Status == AttendanceStatus.Absent),
            attendanceRecords.Count(a => a.Status == AttendanceStatus.Late),
            attendanceRecords.Count(a => a.Status == AttendanceStatus.Excused)
        );

        // 2. Fetch all classmates to calculate RANK
        var classmates = await dbContent.Set<SchoolERP.Domain.Academic.Enrollment>()
            .Where(e => e.ClassroomId == enrollment.ClassroomId && e.AcademicYearId == enrollment.AcademicYearId && e.Status == EnrollmentStatus.Active)
            .Select(e => e.StudentId)
            .ToListAsync(cancellationToken);

        // Calculate averages for ALL classmates (this can be optimized for larger classes)
        var allGrades = await dbContent.Set<SchoolERP.Domain.Academic.Grade>()
            .Include(g => g.Subject)
            .Where(g => classmates.Contains(g.StudentId) && g.Semester == request.Period && g.AcademicYearId == enrollment.AcademicYearId)
            .ToListAsync(cancellationToken);

        var studentsAverages = new Dictionary<Guid, decimal>();
        foreach (var studentId in classmates)
        {
            var studentGrades = allGrades.Where(g => g.StudentId == studentId).ToList();
            studentsAverages[studentId] = CalculateStudentAverage(studentGrades, maxGrade, studentId == request.StudentId ? attendanceSummary : null);
        }

        var sortedAverages = studentsAverages.OrderByDescending(x => x.Value).ToList();
        var rankPosition = sortedAverages.FindIndex(x => x.Key == request.StudentId) + 1;

        // 3. Prepare Final Result for Current Student
        var currentsGrades = allGrades.Where(g => g.StudentId == request.StudentId).ToList();
        var subjectsGrouped = currentsGrades.GroupBy(g => g.SubjectId);
        var subjectResults = new List<SubjectResultDto>();
        
        decimal totalFinalPoints = 0;
        decimal totalCoeffs = 0;
        
        decimal theoryPoints = 0;
        decimal theoryCoeffs = 0;
        decimal stagePoints = 0;
        decimal stageCoeffs = 0;

        foreach (var group in subjectsGrouped)
        {
            var subject = group.First().Subject;
            if (subject == null) continue;

            decimal moyClasse = group.Where(g => g.ExamType == ExamType.Continuous).Any() 
                ? group.Where(g => g.ExamType == ExamType.Continuous).Average(g => g.Score * maxGrade / g.MaxScore) : 0;
            
            decimal moyComp = group.Where(g => g.ExamType == ExamType.Final).Any() 
                ? group.Where(g => g.ExamType == ExamType.Final).Average(g => g.Score * maxGrade / g.MaxScore) : 0;

            if (subject.Name.ToUpper().Contains("CONDUITE"))
            {
                if (moyClasse == 0 && attendanceRecords.Any())
                {
                    moyClasse = CalculateConductScore(attendanceSummary, maxGrade);
                    moyComp = moyClasse;
                }
            }

            decimal finalMoySubject = (moyClasse + (moyComp * 2)) / 3;
            decimal points = finalMoySubject * subject.Coefficient;

            totalFinalPoints += points;
            totalCoeffs += subject.Coefficient;
            
            if (subject.IsStage)
            {
                stagePoints += points;
                stageCoeffs += subject.Coefficient;
            }
            else
            {
                theoryPoints += points;
                theoryCoeffs += subject.Coefficient;
            }

            subjectResults.Add(new SubjectResultDto(
                subject.Name + (subject.IsStage ? " (Stage)" : ""),
                Math.Round(moyClasse, 2),
                Math.Round(moyComp, 2),
                subject.Coefficient,
                Math.Round(finalMoySubject, 2),
                Math.Round(points, 2),
                GetAppreciation(finalMoySubject)
            ));
        }

        var specialty = await dbContent.Set<SchoolERP.Domain.Academic.Specialty>()
            .FirstOrDefaultAsync(s => s.Id == enrollment.Classroom!.SpecialtyId, cancellationToken);

        return new StudentBulletinDto
        {
            StudentName = student.FullName,
            ClassName = enrollment.Classroom?.Name ?? "N/A",
            SpecialtyName = specialty?.Name ?? enrollment.Classroom?.Stream ?? "N/A",
            AcademicYear = enrollment.AcademicYear?.Name ?? "N/A",
            Period = request.Period,
            TotalPoints = Math.Round(totalFinalPoints, 2),
            TotalCoefficients = totalCoeffs,
            PeriodAverage = Math.Round(studentsAverages[request.StudentId], 2),
            TheoryAverage = theoryCoeffs > 0 ? Math.Round(theoryPoints / theoryCoeffs, 2) : 0,
            StageAverage = stageCoeffs > 0 ? Math.Round(stagePoints / stageCoeffs, 2) : 0,
            Rank = $"{rankPosition} ème / {classmates.Count}",
            Attendance = attendanceSummary,
            MaxGrade = maxGrade,
            Subjects = subjectResults
        };
    }

    private decimal CalculateStudentAverage(List<SchoolERP.Domain.Academic.Grade> grades, int maxGrade, AttendanceSummaryDto? attendance = null)
    {
        var grouped = grades.GroupBy(g => g.SubjectId);
        decimal totalPoints = 0;
        decimal totalCoeffs = 0;

        foreach (var group in grouped)
        {
            var subject = group.First().Subject;
            if (subject == null) continue;

            decimal moyClasse = group.Where(g => g.ExamType == ExamType.Continuous).Any() ? group.Where(g => g.ExamType == ExamType.Continuous).Average(g => g.Score * maxGrade / g.MaxScore) : 0;
            decimal moyComp = group.Where(g => g.ExamType == ExamType.Final).Any() ? group.Where(g => g.ExamType == ExamType.Final).Average(g => g.Score * maxGrade / g.MaxScore) : 0;

            if (subject.Name.ToUpper().Contains("CONDUITE") && attendance != null && moyClasse == 0)
            {
                moyClasse = CalculateConductScore(attendance, maxGrade);
                moyComp = moyClasse;
            }

            decimal finalMoy = (moyClasse + (moyComp * 2)) / 3;
            totalPoints += finalMoy * subject.Coefficient;
            totalCoeffs += subject.Coefficient;
        }

        return totalCoeffs > 0 ? totalPoints / totalCoeffs : 0;
    }

    private decimal CalculateConductScore(AttendanceSummaryDto summary, int maxGrade = 20)
    {
        // Start with maxGrade, minus 1 per unjustified absence, minus 0.2 per late
        decimal score = maxGrade;
        score -= summary.Absent * 1.0m * (maxGrade / 20.0m);
        score -= summary.Late * 0.2m * (maxGrade / 20.0m);
        return Math.Max(0, score);
    }

    private string GetAppreciation(decimal avg)
    {
        return avg switch
        {
            >= 16 => "Très Bien",
            >= 14 => "Bien",
            >= 12 => "Assez Bien",
            >= 10 => "Passable",
            >= 8 => "Insuffisant",
            >= 5 => "Faible",
            _ => "Très Faible"
        };
    }
}
