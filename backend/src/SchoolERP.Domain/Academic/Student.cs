using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Academic;

/// <summary>
/// Represents a student enrolled in the school.
/// </summary>
public class Student : TenantEntity
{
    public string StudentNumber { get; private set; } = string.Empty; // Auto-generated unique ID
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public DateTime DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public string? PhotoUrl { get; private set; }
    public string NationalId { get; private set; } = string.Empty;

    // Parent/Guardian Contact
    public string ParentName { get; private set; } = string.Empty;
    public string ParentPhone { get; private set; } = string.Empty;
    public string ParentEmail { get; private set; } = string.Empty;
    public string ParentRelationship { get; private set; } = string.Empty;

    public bool IsActive { get; private set; } = true;

    // Navigation
    private readonly List<Enrollment> _enrollments = new();
    public IReadOnlyCollection<Enrollment> Enrollments => _enrollments.AsReadOnly();

    private Student() { }

    public static Student Create(
        Guid tenantId,
        string firstName,
        string lastName,
        DateTime dateOfBirth,
        Gender gender,
        string nationalId,
        string parentName,
        string parentPhone,
        string parentEmail,
        string parentRelationship)
    {
        var student = new Student
        {
            TenantId = tenantId,
            FirstName = firstName,
            LastName = lastName,
            DateOfBirth = dateOfBirth,
            Gender = gender,
            NationalId = nationalId,
            ParentName = parentName,
            ParentPhone = parentPhone,
            ParentEmail = parentEmail,
            ParentRelationship = parentRelationship
        };

        // Generate student number: STU-{Year}-{Random5Digits}
        student.StudentNumber = $"STU-{DateTime.UtcNow.Year}-{new Random().Next(10000, 99999)}";

        return student;
    }

    public void Update(
        string firstName, string lastName, string parentName,
        string parentPhone, string parentEmail, string? photoUrl)
    {
        FirstName = firstName;
        LastName = lastName;
        ParentName = parentName;
        ParentPhone = parentPhone;
        ParentEmail = parentEmail;
        PhotoUrl = photoUrl;
    }

    public void Deactivate() => IsActive = false;
}
