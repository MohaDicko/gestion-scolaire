using SchoolERP.Domain.Common;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.HR;

/// <summary>
/// Represents an employee of the school (teacher, staff, admin...).
/// </summary>
public class Employee : TenantEntity
{
    public string EmployeeNumber { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string Email { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public DateTime DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public DateTime HireDate { get; private set; }
    public EmployeeType EmployeeType { get; private set; } // Teacher, Administrative, Support
    public string? PhotoUrl { get; private set; }
    public bool IsActive { get; private set; } = true;

    public Guid DepartmentId { get; private set; }

    // Navigation
    public Department? Department { get; private set; }

    private readonly List<Contract> _contracts = new();
    public IReadOnlyCollection<Contract> Contracts => _contracts.AsReadOnly();

    private readonly List<LeaveRequest> _leaveRequests = new();
    public IReadOnlyCollection<LeaveRequest> LeaveRequests => _leaveRequests.AsReadOnly();

    private Employee() { }

    public static Employee Create(
        Guid tenantId, string firstName, string lastName,
        string email, string phoneNumber, DateTime dateOfBirth,
        Gender gender, DateTime hireDate, EmployeeType employeeType,
        Guid departmentId)
    {
        var employee = new Employee
        {
            TenantId = tenantId,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            PhoneNumber = phoneNumber,
            DateOfBirth = dateOfBirth,
            Gender = gender,
            HireDate = hireDate,
            EmployeeType = employeeType,
            DepartmentId = departmentId
        };

        employee.EmployeeNumber = $"EMP-{DateTime.UtcNow.Year}-{new Random().Next(10000, 99999)}";
        return employee;
    }

    public void Update(string firstName, string lastName, string email,
        string phoneNumber, Guid departmentId, string? photoUrl)
    {
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        PhoneNumber = phoneNumber;
        DepartmentId = departmentId;
        PhotoUrl = photoUrl;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
