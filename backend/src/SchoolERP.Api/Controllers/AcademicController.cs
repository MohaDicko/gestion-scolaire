using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.Academic.Commands.Classrooms;
using SchoolERP.Application.Academic.Commands.Enrollments;
using SchoolERP.Application.Academic.Commands.Students;
using SchoolERP.Application.Academic.Queries.GetAcademicYears;
using SchoolERP.Application.Academic.Queries.GetClassroomById;
using SchoolERP.Application.Academic.Queries.GetClassrooms;
using SchoolERP.Application.Academic.Queries.GetEnrollments;
using SchoolERP.Application.Academic.Queries.GetStudentBulletin;
using SchoolERP.Application.Academic.Queries.GetStudentById;
using SchoolERP.Application.Academic.Queries.GetStudents;
using SchoolERP.Application.Academic.Queries.GetSubjects;
using SchoolERP.Application.Academic.Commands.Grades;
using SchoolERP.Application.Academic.Queries.GetGrades;
using SchoolERP.Application.Academic.Queries.GetClassAttendance;
using SchoolERP.Application.Academic.Commands.RecordClassAttendance;
using SchoolERP.Application.Academic.Commands.Schedules;
using SchoolERP.Application.Academic.Queries.GetClassSchedule;
using SchoolERP.Application.Academic.Queries.GetStudentDashboard;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,SchoolAdmin,Teacher,Student")]
public class AcademicController : ControllerBase
{
    private readonly IMediator _mediator;

    public AcademicController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents([FromQuery] GetStudentsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("students/{id}")]
    public async Task<IActionResult> GetStudentById(Guid id)
    {
        var student = await _mediator.Send(new GetStudentByIdQuery(id));
        return student == null ? NotFound() : Ok(student);
    }

    [HttpPost("students")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> CreateStudent([FromBody] CreateStudentCommand command)
    {
        var id = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetStudentById), new { id }, id);
    }

    [HttpPut("students/{id}")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> UpdateStudent(Guid id, [FromBody] UpdateStudentCommand command)
    {
        if (id != command.Id) return BadRequest("ID mismatch");
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("students/{id}")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> DeactivateStudent(Guid id)
    {
        await _mediator.Send(new DeactivateStudentCommand(id));
        return NoContent();
    }

    /// <summary>
    /// Gets a student's bulletin containing all their grades and average score.
    /// Accessible by: SuperAdmin, SchoolAdmin, Teacher, Student (only own bulletin)
    /// </summary>
    [HttpGet("students/{studentId}/bulletin")]
    public async Task<IActionResult> GetStudentBulletin(Guid studentId, [FromQuery] int semester = 1)
    {
        var query = new GetStudentBulletinQuery(studentId, semester);
        var bulletin = await _mediator.Send(query);
        return Ok(bulletin);
    }

    /// <summary>
    /// Import a list of students from an Excel file into a specific classroom.
    /// </summary>
    [HttpPost("classrooms/{classroomId}/students/import")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> ImportStudents([FromRoute] Guid classroomId, IFormFile file, [FromForm] Guid academicYearId)
    {
        if (file == null || file.Length == 0) return BadRequest("Please upload an Excel file.");
        
        using var stream = file.OpenReadStream();
        var command = new SchoolERP.Application.Academic.Commands.ImportStudents.ImportStudentsFromExcelCommand(stream, classroomId, academicYearId);
        var count = await _mediator.Send(command);
        return Ok(new { StudentsImported = count });
    }

    /// <summary>
    /// Export highly-performing students (Average > MinScore) to Excel.
    /// </summary>
    [HttpGet("classrooms/{classroomId}/students/export-high-performers")]
    public async Task<IActionResult> ExportHighPerformers(Guid classroomId, [FromQuery] decimal minScore = 15)
    {
        var query = new SchoolERP.Application.Academic.Queries.ExportStudents.ExportHighPerformersQuery(classroomId, minScore);
        var excelBytes = await _mediator.Send(query);
        
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Students_Above_{minScore}.xlsx");
    }

    // --- CLASSROOMS ---

    [HttpGet("classrooms")]
    public async Task<IActionResult> GetClassrooms()
    {
        var classrooms = await _mediator.Send(new GetClassroomsQuery());
        return Ok(classrooms);
    }

    [HttpGet("classrooms/{id}")]
    public async Task<IActionResult> GetClassroomById(Guid id)
    {
        var classroom = await _mediator.Send(new GetClassroomByIdQuery(id));
        return classroom == null ? NotFound() : Ok(classroom);
    }

    [HttpPost("classrooms")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> CreateClassroom([FromBody] CreateClassroomCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(id);
    }

    [HttpDelete("classrooms/{id}")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> DeleteClassroom(Guid id)
    {
        await _mediator.Send(new DeleteClassroomCommand(id));
        return NoContent();
    }

    // --- ENROLLMENTS ---

    [HttpGet("enrollments")]
    public async Task<IActionResult> GetEnrollments([FromQuery] GetEnrollmentsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("enrollments")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(id);
    }

    [HttpPost("enrollments/transfer")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> TransferStudent([FromBody] TransferStudentCommand command)
    {
        await _mediator.Send(command);
        return Ok();
    }

    // --- ACADEMIC YEARS ---

    [HttpGet("years")]
    public async Task<IActionResult> GetAcademicYears()
    {
        var years = await _mediator.Send(new GetAcademicYearsQuery());
        return Ok(years);
    }

    // --- SUBJECTS ---

    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects()
    {
        var subjects = await _mediator.Send(new GetSubjectsQuery());
        return Ok(subjects);
    }

    // --- GRADES ---

    [HttpGet("grades")]
    public async Task<IActionResult> GetClassroomGrades(
        [FromQuery] Guid classroomId,
        [FromQuery] Guid subjectId,
        [FromQuery] Guid academicYearId,
        [FromQuery] int semester,
        [FromQuery] ExamType examType)
    {
        var query = new GetClassroomGradesQuery(classroomId, subjectId, academicYearId, semester, examType);
        var grades = await _mediator.Send(query);
        return Ok(grades);
    }

    [HttpPost("grades/bulk")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin,Teacher")]
    public async Task<IActionResult> SubmitGradesBulk([FromBody] SubmitGradesCommand command)
    {
        var count = await _mediator.Send(command);
        return Ok(new { Count = count });
    }

    [HttpGet("classrooms/{classroomId}/attendance")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin,Teacher")]
    public async Task<IActionResult> GetClassAttendance(Guid classroomId, [FromQuery] DateTime date)
    {
        var result = await _mediator.Send(new GetClassAttendanceQuery(classroomId, date));
        return Ok(result);
    }

    [HttpPost("classrooms/{classroomId}/attendance")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin,Teacher")]
    public async Task<IActionResult> RecordClassAttendance(Guid classroomId, [FromBody] RecordClassAttendanceCommand command)
    {
        if (classroomId != command.ClassroomId) return BadRequest();
        
        await _mediator.Send(command);
        return Ok();
    }

    [HttpGet("classrooms/{classroomId}/schedule")]
    public async Task<IActionResult> GetClassSchedule(Guid classroomId)
    {
        var result = await _mediator.Send(new GetClassScheduleQuery(classroomId));
        return Ok(result);
    }

    [HttpPost("classrooms/{classroomId}/schedule")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public async Task<IActionResult> SetClassSchedule(Guid classroomId, [FromBody] SetClassScheduleCommand command)
    {
        if (classroomId != command.ClassroomId) return BadRequest();
        await _mediator.Send(command);
        return Ok();
    }

    [HttpGet("students/{studentId}/portal")]
    public async Task<IActionResult> GetStudentPortal(Guid studentId)
    {
        var result = await _mediator.Send(new GetStudentDashboardQuery(studentId));
        return Ok(result);
    }
}
