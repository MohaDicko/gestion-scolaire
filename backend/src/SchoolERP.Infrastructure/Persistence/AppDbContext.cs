using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Common;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;
using SchoolERP.Domain.Notifications;
using SchoolERP.Domain.Events;
using SchoolERP.Domain.Auth;

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
    public DbSet<Campus> Campuses => Set<Campus>();
    public DbSet<SchoolSection> SchoolSections => Set<SchoolSection>();
    public DbSet<Specialty> Specialties => Set<Specialty>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Sanction> Sanctions => Set<Sanction>();
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
    public DbSet<SchoolERP.Domain.Finance.PaymentPlan> PaymentPlans => Set<SchoolERP.Domain.Finance.PaymentPlan>();
    public DbSet<SchoolERP.Domain.Finance.PaymentInstallment> PaymentInstallments => Set<SchoolERP.Domain.Finance.PaymentInstallment>();
    public DbSet<SchoolERP.Domain.Finance.Expense> Expenses => Set<SchoolERP.Domain.Finance.Expense>();

    // ── Notifications ──────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();

    // ── Events ──────────────────────────────────────────
    public DbSet<SchoolEvent> SchoolEvents => Set<SchoolEvent>();

    // ── Auth & Identity ──────────────────────────────────
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ── GLOBAL QUERY FILTERS (Multi-Tenant isolation) ────
        // Automatically apply tenant filter to all entities deriving from TenantEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(TenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                // Apply Global Query Filter
                var method = typeof(AppDbContext).GetMethod(nameof(ApplyTenantFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                    ?.MakeGenericMethod(entityType.ClrType);
                method?.Invoke(this, new object[] { modelBuilder });

                // Automatic Index for performance
                modelBuilder.Entity(entityType.ClrType).HasIndex(nameof(TenantEntity.TenantId));
            }
        }

        // ── CUSTOM CONFIGURATIONS ─────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.OwnsMany(u => u.RefreshTokens, rt =>
            {
                rt.WithOwner().HasForeignKey("UserId");
                rt.HasKey(t => t.Id);
                rt.ToTable("RefreshTokens");
            });
        });
    }

    private void ApplyTenantFilter<T>(ModelBuilder modelBuilder) where T : TenantEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(e => e.TenantId == _tenantService.GetCurrentTenantId());
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically populate audit fields.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentUserId = _tenantService.GetCurrentUserId();
        var currentTenantId = _tenantService.GetCurrentTenantId();

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.CreatedBy = currentUserId;

                // Automatic TenantId injection for new entities
                if (entry.Entity is TenantEntity tenantEntity && tenantEntity.TenantId == Guid.Empty)
                {
                    // Using reflection because TenantId is protected
                    entry.Property("TenantId").CurrentValue = currentTenantId;
                }
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedAt = DateTime.UtcNow;
                entry.Entity.LastModifiedBy = currentUserId;
            }

            // Global UTC Fix for Npgsql
            foreach (var prop in entry.Properties)
            {
                if ((entry.State == EntityState.Added || entry.State == EntityState.Modified) &&
                    prop.Metadata.ClrType == typeof(DateTime) && prop.CurrentValue is DateTime dt)
                {
                    if (dt.Kind != DateTimeKind.Utc)
                    {
                        prop.CurrentValue = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                    }
                }
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
