using MediatR;
using Microsoft.EntityFrameworkCore;
using MiniExcelLibs;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Queries.ExportStudents;

public record ExportHighPerformersQuery(Guid ClassroomId, decimal MinAverage) : IRequest<byte[]>;

public class ExportHighPerformersQueryHandler : IRequestHandler<ExportHighPerformersQuery, byte[]>
{
    private readonly IUnitOfWork _unitOfWork;

    public ExportHighPerformersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<byte[]> Handle(ExportHighPerformersQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        // Fetch students and their grades for calculations
        // This is a complex query to demonstrate your specific request: filtering by average score 
        var studentsWithGrades = await db.Set<Enrollment>()
            .Include(e => e.Student)
            .Include(e => e.Classroom)
            .Where(e => e.ClassroomId == request.ClassroomId && e.Status == SchoolERP.Domain.Enums.EnrollmentStatus.Active)
            .Select(e => new {
                e.Student!.FullName,
                e.Student.StudentNumber,
                ClassName = e.Classroom!.Name,
                Grades = db.Set<Grade>().Where(g => g.StudentId == e.StudentId).Select(g => new { g.Score, g.MaxScore, g.Subject!.Coefficient }).ToList()
            })
            .ToListAsync(cancellationToken);

        var reportData = studentsWithGrades
            .Select(s => {
                decimal totalWeightedScore = 0;
                decimal totalCoefficients = 0;
                foreach (var g in s.Grades)
                {
                    totalWeightedScore += (g.Score * 20 / g.MaxScore) * g.Coefficient;
                    totalCoefficients += g.Coefficient;
                }
                var average = totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;
                return new {
                    s.FullName,
                    s.StudentNumber,
                    s.ClassName,
                    Average = Math.Round(average, 2)
                };
            })
            .Where(s => s.Average >= request.MinAverage)
            .OrderByDescending(s => s.Average)
            .ToList();

        using var memoryStream = new MemoryStream();
        memoryStream.SaveAs(reportData);
        return memoryStream.ToArray();
    }
}
