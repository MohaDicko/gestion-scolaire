using MediatR;
using Microsoft.EntityFrameworkCore;
using MiniExcelLibs;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Academic.Commands.ImportStudents;

public record ImportStudentsFromExcelCommand(Stream ExcelStream, Guid ClassroomId, Guid AcademicYearId) : IRequest<int>;

public class ImportStudentsFromExcelCommandHandler : IRequestHandler<ImportStudentsFromExcelCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public ImportStudentsFromExcelCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<int> Handle(ImportStudentsFromExcelCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();
        
        // Reading Excel rows as dynamics (assuming specific column names)
        var rows = request.ExcelStream.Query(useHeaderRow: true).ToList();
        int importedCount = 0;

        foreach (var row in rows)
        {
            // Expected columns: FirstName, LastName, DateOfBirth, Gender, NationalId, ParentName, ParentPhone, ParentEmail
            string firstName = row.FirstName?.ToString() ?? "";
            string lastName = row.LastName?.ToString() ?? "";
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)) continue;

            DateTime dob = DateTime.TryParse(row.DateOfBirth?.ToString(), out DateTime d) ? d : new DateTime(2010, 1, 1);
            Gender gender = Enum.TryParse<Gender>(row.Gender?.ToString(), true, out Gender g) ? g : Gender.Other;

            var classroom = await db.Set<Classroom>().FindAsync(new object[] { request.ClassroomId }, cancellationToken);
            Guid campusId = classroom?.CampusId ?? Guid.Empty;

            var student = Student.Create(
                tenantId,
                firstName,
                lastName,
                dob,
                gender,
                row.NationalId?.ToString() ?? "",
                row.ParentName?.ToString() ?? "",
                row.ParentPhone?.ToString() ?? "",
                row.ParentEmail?.ToString() ?? "",
                "Parent",
                campusId
            );

            await db.AddAsync(student, cancellationToken);
            
            // Create enrollment for the student in the target class
            var enrollment = Enrollment.Create(tenantId, student.Id, request.ClassroomId, request.AcademicYearId);
            await db.AddAsync(enrollment, cancellationToken);

            importedCount++;
        }

        if (importedCount > 0)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return importedCount;
    }
}
