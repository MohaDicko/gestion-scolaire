using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Commands.Grades;

public record GradeEntryDto(Guid StudentId, decimal Score, string? Comment);

public record SubmitGradesCommand(
    Guid SubjectId,
    Guid AcademicYearId,
    int Semester,
    ExamType ExamType,
    decimal MaxScore,
    List<GradeEntryDto> Grades) : IRequest<int>;

public class SubmitGradesCommandHandler : IRequestHandler<SubmitGradesCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public SubmitGradesCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<int> Handle(SubmitGradesCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        int addedOrUpdated = 0;

        foreach (var entry in request.Grades)
        {
            // Check if the grade already exists to update it
            var existingGrade = await db.Set<Grade>()
                .FirstOrDefaultAsync(g => g.StudentId == entry.StudentId && 
                                          g.SubjectId == request.SubjectId &&
                                          g.AcademicYearId == request.AcademicYearId &&
                                          g.Semester == request.Semester &&
                                          g.ExamType == request.ExamType, cancellationToken);

            if (existingGrade != null)
            {
                existingGrade.Correct(entry.Score, entry.Comment);
            }
            else
            {
                var newGrade = Grade.Create(
                    tenantId,
                    entry.StudentId,
                    request.SubjectId,
                    request.AcademicYearId,
                    entry.Score,
                    request.MaxScore,
                    request.Semester,
                    request.ExamType,
                    entry.Comment
                );
                await db.AddAsync(newGrade, cancellationToken);
            }
            addedOrUpdated++;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        return addedOrUpdated;
    }
}
