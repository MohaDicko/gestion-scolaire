using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Events;
using SchoolERP.Domain.Auth;
using SchoolERP.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class SeedController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;
    private readonly IPasswordHasher _passwordHasher;

    public SeedController(IUnitOfWork unitOfWork, ITenantService tenantService, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("demo-data")]
    [AllowAnonymous]
    public async Task<IActionResult> SeedDemoData()
    {
        var db = (DbContext)_unitOfWork;
        
        // 1. Create Default School
        var schoolsFound = await db.Set<School>().AnyAsync();
        var school = School.Create("Lycée Bamako", "LYC-BKO", "Baco Djicoroni", "Bamako", "Mali", "+223 70 00 00 00", "contact@lyceebamako.ml", SchoolType.Private);
        db.Add(school);

        // 1.5 System School
        var systemSchoolId = Guid.Empty;
        if (!await db.Set<School>().AnyAsync(s => s.Id == systemSchoolId))
        {
            var systemSchool = School.Create("System", "SYSTEM", "N/A", "N/A", "N/A", "N/A", "system@schoolerp.com", SchoolType.Private);
            typeof(School).GetProperty("Id", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic)?
                .SetValue(systemSchool, systemSchoolId);
            db.Add(systemSchool);
        }

        await _unitOfWork.SaveChangesAsync();
        var tenantId = school.Id;

        // 2. Campus & Section
        var campus = Campus.Create(tenantId, "Campus Principal", "Avenue du Mali", "Bamako", "District de Bamako", "223-222-222");
        db.Add(campus);

        var section = SchoolSection.Create(tenantId, "Enseignement Général", "LYCEE", 20, "Lycée classique");
        db.Add(section);
        await _unitOfWork.SaveChangesAsync();

        // 3. Academic Year
        var year = AcademicYear.Create(tenantId, "2023-2024", DateTime.UtcNow.AddMonths(-6), DateTime.UtcNow.AddMonths(6));
        db.Add(year);

        // 4. Classroom
        var cls = Classroom.Create(tenantId, "10ème Commune", "10C", 40, year.Id, campus.Id, section.Id);
        db.Add(cls);

        // 5. Subject
        var math = Subject.Create(tenantId, "Mathématiques", "MATH", 4.0m);
        var fr = Subject.Create(tenantId, "Français", "FR", 3.0m);
        db.Add(math); db.Add(fr);

        await _unitOfWork.SaveChangesAsync();

        // 6. Students & Enrollments
        for (int i = 1; i <= 20; i++)
        {
            var student = Student.Create(tenantId, $"Eleve{i}", "Nom", DateTime.UtcNow.AddYears(-15), Gender.Male, $"MAT{i:D4}", "Parent", "555-0123", "p@e.com", "Father", campus.Id);
            db.Add(student);
            
            var enrollment = Enrollment.Create(tenantId, student.Id, cls.Id, year.Id);
            db.Add(enrollment);

            db.Add(Grade.Create(tenantId, student.Id, math.Id, year.Id, (decimal)(10 + i % 10), 20, 1, ExamType.Continuous, "Bien"));
            db.Add(Grade.Create(tenantId, student.Id, fr.Id, year.Id, (decimal)(12 + i % 8), 20, 1, ExamType.Continuous, "Assez bien"));
            
            var inv = StudentInvoice.Create(tenantId, student.Id, year.Id, "Frais de Scolarité T1", 150000, FeeType.Tuition, DateTime.UtcNow.AddDays(30));
            db.Add(inv);
        }

        // 7. HR
        var dept = Department.Create(tenantId, "Enseignement", "ENS");
        db.Add(dept);
        await _unitOfWork.SaveChangesAsync();

        var emp = Employee.Create(tenantId, "Lamine", "Coulibaly", "lamine.c@school.com", "+223 77001122", DateTime.UtcNow.AddYears(-35), Gender.Male, DateTime.UtcNow.AddYears(-5), EmployeeType.Teacher, dept.Id, campus.Id);
        db.Add(emp);
        
        var contract = Contract.Create(tenantId, emp.Id, ContractType.CDI, DateTime.UtcNow.AddYears(-5), null, 350000);
        db.Add(contract); 

        await _unitOfWork.SaveChangesAsync();

        // 8. Events & Users
        await SeedSchoolEvents(db, tenantId);
        await SeedUsers(db, tenantId);

        return Ok("Demo multi-cycle data seeded successfully.");
    }

    private async Task SeedUsers(DbContext db, Guid tenantId)
    {
        var hasher = _passwordHasher;
        if (!await db.Set<User>().AnyAsync(u => u.Email == "admin@school.com"))
        {
            db.Add(Domain.Auth.User.Create(tenantId, "admin@school.com", hasher.HashPassword("Admin@1234"), "Admin", "Moha", UserRole.SchoolAdmin));
            db.Add(Domain.Auth.User.Create(tenantId, "prof@school.com", hasher.HashPassword("Admin@1234"), "Prof", "Solo", UserRole.Teacher));
            db.Add(Domain.Auth.User.Create(tenantId, "comptable@school.com", hasher.HashPassword("Admin@1234"), "Agent", "Finance", UserRole.Accountant));
        }

        var superAdminId = Guid.Empty;
        if (!await db.Set<User>().AnyAsync(u => u.Email == "super@schoolerp.com"))
        {
            db.Add(Domain.Auth.User.Create(superAdminId, "super@schoolerp.com", hasher.HashPassword("Super@1234"), "Super", "Admin", UserRole.SuperAdmin));
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private async Task SeedSchoolEvents(DbContext db, Guid tenantId)
    {
        var events = new List<SchoolEvent>
        {
            SchoolEvent.Create(tenantId, "Rentrée scolaire", "Accueil", DateTime.UtcNow.AddDays(10), DateTime.UtcNow.AddDays(10), EventCategory.Ceremony, true, "Cour")
        };
        await db.Set<SchoolEvent>().AddRangeAsync(events);
        await _unitOfWork.SaveChangesAsync();
    }
}
