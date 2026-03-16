using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Common;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;
using SchoolERP.Domain.Notifications;
using SchoolERP.Domain.Events;

namespace SchoolERP.Infrastructure.Persistence;

/// <summary>
/// Main EF Core DbContext.
/// Implements:
///   - Multi-Tenant isolation via Global Query Filters
///   - Automatic Audit Trail via SaveChangesAsync override
/// </summary>
public class AppDbContext : DbContext, IUnitOfWork
{
    private readonly ITenantService _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    // ── Academic Context ─────────────────────────────────────
    public DbSet<School> Schools => Set<School>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Classroom> Classrooms => Set<Classroom>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<ClassSchedule> ClassSchedules => Set<ClassSchedule>();

    // ── HR Context ───────────────────────────────────────────
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<StaffAttendance> StaffAttendances => Set<StaffAttendance>();

    // ── Payroll Context ──────────────────────────────────────
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<Payslip> Payslips => Set<Payslip>();
    public DbSet<PayslipLine> PayslipLines => Set<PayslipLine>();

    // ── Finance Context ──────────────────────────────────────
    public DbSet<SchoolERP.Domain.Finance.StudentInvoice> StudentInvoices => Set<SchoolERP.Domain.Finance.StudentInvoice>();
    public DbSet<SchoolERP.Domain.Finance.StudentPayment> StudentPayments => Set<SchoolERP.Domain.Finance.StudentPayment>();
    public DbSet<SchoolERP.Domain.Finance.Expense> Expenses => Set<SchoolERP.Domain.Finance.Expense>();

    // ── Notifications ──────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();

    // ── Events ──────────────────────────────────────────
    public DbSet<SchoolEvent> SchoolEvents => Set<SchoolEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ── GLOBAL QUERY FILTERS (Multi-Tenant isolation) ────
        // IMPORTANT: The lambda must reference _tenantService directly (not a local variable)
        // so EF Core evaluates it at QUERY TIME, not at model building time.
        modelBuilder.Entity<AcademicYear>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<Classroom>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<Student>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<Enrollment>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<Subject>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<Department>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<Employee>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<LeaveRequest>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<StaffAttendance>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<PayrollRun>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<SchoolERP.Domain.Finance.StudentInvoice>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
        modelBuilder.Entity<SchoolERP.Domain.Finance.StudentPayment>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically populate audit fields.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentUserId = _tenantService.GetCurrentUserId();

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.CreatedBy = currentUserId;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedAt = DateTime.UtcNow;
                entry.Entity.LastModifiedBy = currentUserId;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
