using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Events;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class SeedController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public SeedController(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    [HttpPost("demo-data")]
    public async Task<IActionResult> SeedDemoData()
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        // 1. Check if already seeded
        if (await db.Set<Student>().AnyAsync()) return BadRequest("Database already has data.");

        // 2. Academic Year
        var year = AcademicYear.Create(tenantId, "2023-2024", DateTime.Now.AddMonths(-6), DateTime.Now.AddMonths(6));
        db.Add(year);

        // 3. Classroom
        var cls = Classroom.Create(tenantId, "6ème A", "6A", 40, year.Id);
        db.Add(cls);

        // 4. Subject
        var math = Subject.Create(tenantId, "Mathématiques", "MATH", 4.0m);
        var fr = Subject.Create(tenantId, "Français", "FR", 3.0m);
        db.Add(math); db.Add(fr);

        await _unitOfWork.SaveChangesAsync();

        // 5. Students & Enrollments
        for (int i = 1; i <= 20; i++)
        {
            var student = Student.Create(tenantId, $"Eleve{i}", "Nom", DateTime.Now.AddYears(-12), Gender.Male, $"MAT{i:D4}", "Parent", "555-0123", "p@e.com", "Father");
            db.Add(student);
            
            var enrollment = Enrollment.Create(tenantId, student.Id, cls.Id, year.Id);
            db.Add(enrollment);

            // Add grades
            db.Add(Grade.Create(tenantId, student.Id, math.Id, year.Id, (decimal)(10 + i % 10), 20, 1, ExamType.Continuous, "Bien"));
            db.Add(Grade.Create(tenantId, student.Id, fr.Id, year.Id, (decimal)(12 + i % 8), 20, 1, ExamType.Continuous, "Assez bien"));
            
            // Add an invoice
            var inv = StudentInvoice.Create(tenantId, student.Id, year.Id, "Frais de Scolarité T1", 150000, FeeType.Tuition, DateTime.Now.AddDays(30));
            db.Add(inv);
        }

        // 6. Employees & Payroll
        var dept = Department.Create(tenantId, "Administration", "ADM");
        db.Add(dept);
        await _unitOfWork.SaveChangesAsync();

        var emp = Employee.Create(tenantId, "Jean", "Dupont", "jean.d@school.com", "+225 11223344", DateTime.Now.AddYears(-30), Gender.Male, DateTime.Now.AddYears(-1), EmployeeType.Administrative, dept.Id);
        db.Add(emp);
        
        var contract = Contract.Create(tenantId, emp.Id, ContractType.CDI, DateTime.Now.AddYears(-1), null, 450000);
        db.Add(contract); 

        await _unitOfWork.SaveChangesAsync();

        // 7. School Calendar Events
        await SeedSchoolEvents(db, tenantId);

        return Ok("Demo data seeded successfully with 20 students, classes, subjects, invoices, 1 employee and school calendar events.");
    }

    [HttpPost("school-events")]
    public async Task<IActionResult> SeedSchoolEventsOnly()
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        // Remove existing seeded events if re-running
        var existing = await db.Set<SchoolEvent>().ToListAsync();
        db.Set<SchoolEvent>().RemoveRange(existing);
        await _unitOfWork.SaveChangesAsync();

        await SeedSchoolEvents(db, tenantId);
        return Ok("Calendrier scolaire 2024-2025 généré avec succès !");
    }

    private async Task SeedSchoolEvents(DbContext db, Guid tenantId)
    {
        var events = new List<SchoolEvent>
        {
            // ── Rentrée & Orientation ────────────────────────────────
            SchoolEvent.Create(tenantId, "Rentrée scolaire 2024-2025", "Accueil des élèves et remise des emplois du temps", new DateTime(2024, 9, 2), new DateTime(2024, 9, 2), EventCategory.Ceremony, true, "Cour de récréation"),
            SchoolEvent.Create(tenantId, "Réunion de rentrée parents-professeurs", "Présentation des enseignants et du règlement intérieur", new DateTime(2024, 9, 6), new DateTime(2024, 9, 6), EventCategory.Meeting, true, "Salle de conférence"),

            // ── 1er Trimestre Oct-Nov ────────────────────────────────
            SchoolEvent.Create(tenantId, "Contrôle du 1er Trimestre - Math & Sciences", "Contrôle continu toutes classes", new DateTime(2024, 10, 7), new DateTime(2024, 10, 11), EventCategory.Exam, false, "Salles de classe"),
            SchoolEvent.Create(tenantId, "Contrôle du 1er Trimestre - Lettres & Langues", "Contrôle continu toutes classes", new DateTime(2024, 10, 14), new DateTime(2024, 10, 18), EventCategory.Exam, false, "Salles de classe"),
            SchoolEvent.Create(tenantId, "Journée sportive du 1er trimestre 🏆", "Complète Football, Athlétisme, Basketball inter-classes", new DateTime(2024, 11, 8), new DateTime(2024, 11, 8), EventCategory.Sports, true, "Terrain de sport"),
            SchoolEvent.Create(tenantId, "Consei de classe 1er Trimestre", "Délibération et remise des bulletins", new DateTime(2024, 11, 22), new DateTime(2024, 11, 22), EventCategory.Meeting, true, "Salle des professeurs"),

            // ── Vacances de Noël ────────────────────────────────────
            SchoolEvent.Create(tenantId, "🎄 Vacances de Noël", "Vacances scolaires de fin d'année", new DateTime(2024, 12, 23), new DateTime(2025, 1, 3), EventCategory.Holiday, true),

            // ── 2ème Trimestre Jan-Mar ───────────────────────────────
            SchoolEvent.Create(tenantId, "Reprise des cours - 2ème Trimestre", null, new DateTime(2025, 1, 6), new DateTime(2025, 1, 6), EventCategory.Ceremony, true),
            SchoolEvent.Create(tenantId, "Examens blancs 2ème Trimestre", "Simulation des examens officiels sur l'ensemble du programme", new DateTime(2025, 2, 3), new DateTime(2025, 2, 7), EventCategory.Exam, false, "Salles de classe"),
            SchoolEvent.Create(tenantId, "Sortie éducative - Musée National 🏛️", "Visite culturelle pour toutes les classes de 4ème et 3ème", new DateTime(2025, 2, 14), new DateTime(2025, 2, 14), EventCategory.SchoolTrip, true, "Musée National"),
            SchoolEvent.Create(tenantId, "Fête de l'Indépendance 🎉", "Jour Férié - Établissement fermé", new DateTime(2025, 2, 28), new DateTime(2025, 2, 28), EventCategory.Holiday, true),
            SchoolEvent.Create(tenantId, "Contrôle de mi-trimestre - Toutes matières", null, new DateTime(2025, 3, 3), new DateTime(2025, 3, 7), EventCategory.Exam, false),
            SchoolEvent.Create(tenantId, "Conseil de classe 2ème Trimestre", "Délibérations et orientation des élèves", new DateTime(2025, 3, 21), new DateTime(2025, 3, 21), EventCategory.Meeting, true, "Salle des professeurs"),

            // ── Vacances de Pâques ──────────────────────────────────
            SchoolEvent.Create(tenantId, "🐣 Vacances de Pâques", "Vacances de printemps", new DateTime(2025, 4, 7), new DateTime(2025, 4, 18), EventCategory.Holiday, true),

            // ── 3ème Trimestre Avr-Juin ──────────────────────────────
            SchoolEvent.Create(tenantId, "Reprise des cours - 3ème Trimestre", null, new DateTime(2025, 4, 22), new DateTime(2025, 4, 22), EventCategory.Ceremony, true),
            SchoolEvent.Create(tenantId, "Journée portes ouvertes 🏫", "Accueil des futurs élèves et de leurs parents", new DateTime(2025, 5, 3), new DateTime(2025, 5, 3), EventCategory.Ceremony, true, "Tout l'établissement"),
            SchoolEvent.Create(tenantId, "Examens de fin d'année - 1ère session", "Examens officiels de fin d'année scolaire", new DateTime(2025, 5, 26), new DateTime(2025, 6, 6), EventCategory.Exam, false, "Salles d'examen"),
            SchoolEvent.Create(tenantId, "Tournoi de football inter-établissements", "Compétition sportive régionale", new DateTime(2025, 6, 7), new DateTime(2025, 6, 7), EventCategory.Sports, true, "Stade municipal"),
            SchoolEvent.Create(tenantId, "Délibération et jury de fin d'année", null, new DateTime(2025, 6, 13), new DateTime(2025, 6, 13), EventCategory.Meeting, true, "Salle de conférence"),
            SchoolEvent.Create(tenantId, "🎓 Cérémonie de remise des diplomes", "Remise des diplomes et distinction des élèves méritants", new DateTime(2025, 6, 20), new DateTime(2025, 6, 20), EventCategory.Ceremony, true, "Salle des fêtes"),
            SchoolEvent.Create(tenantId, "☀️ Grandes vacances 2025", "Fin de l'année scolaire 2024-2025", new DateTime(2025, 6, 28), new DateTime(2025, 9, 1), EventCategory.Holiday, true),
        };

        await db.Set<SchoolEvent>().AddRangeAsync(events);
        await _unitOfWork.SaveChangesAsync();
    }
}
