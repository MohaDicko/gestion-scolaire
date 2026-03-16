using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Application.Payroll.Commands.ProcessMonthlyPayroll;

public record ProcessMonthlyPayrollCommand(int Month, int Year) : IRequest<Guid>;

public class ProcessMonthlyPayrollCommandHandler : IRequestHandler<ProcessMonthlyPayrollCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public ProcessMonthlyPayrollCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(ProcessMonthlyPayrollCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        // 1. Check if a finalized run already exists
        var existingRun = await db.Set<PayrollRun>()
            .FirstOrDefaultAsync(r => r.Month == request.Month && r.Year == request.Year, cancellationToken);
            
        if (existingRun != null && existingRun.Status == PayrollRunStatus.Finalized)
            throw new Exception("Payroll for this month is already finalized.");

        if (existingRun == null)
        {
            existingRun = PayrollRun.Create(tenantId, request.Month, request.Year, Guid.Empty); // TODO: user context
            db.Add(existingRun);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // 2. Identify all active employees with active contracts
        var activeEmployees = await db.Set<Employee>()
            .Include(e => e.Contracts)
            .Where(e => e.IsActive)
            .ToListAsync(cancellationToken);

        int count = 0;
        foreach (var employee in activeEmployees)
        {
            var activeContract = employee.Contracts
                .FirstOrDefault(c => c.Status == ContractStatus.Active);
                
            if (activeContract == null) continue;

            // Check if payslip already exists for this run and employee
            var existingPayslip = await db.Set<Payslip>()
                .AnyAsync(p => p.PayrollRunId == existingRun.Id && p.EmployeeId == employee.Id, cancellationToken);
                
            if (existingPayslip) continue;

            // Enhanced Calculation
            var baseSalary = activeContract.BaseSalary;
            var transport = 15000m;
            var housing = baseSalary * 0.05m; // 5% housing
            
            // Deductions
            var cnps = (baseSalary + transport + housing) * 0.063m; // 6.3% CNPS
            var igr = (baseSalary + transport + housing) * 0.05m; // 5% IGR
            
            var payslip = Payslip.Create(
                tenantId,
                employee.Id,
                existingRun.Id,
                baseSalary,
                0m, // will be updated by AddLine
                0m, // will be updated by AddLine
                request.Month,
                request.Year
            );

            // Add breakdown lines
            payslip.AddLine("Salaire de base", SalaryElementType.Allowance, baseSalary);
            payslip.AddLine("Indemnité de transport", SalaryElementType.Allowance, transport);
            payslip.AddLine("Indemnité de logement", SalaryElementType.Allowance, housing);
            payslip.AddLine("Cotisation CNPS (6.3%)", SalaryElementType.Deduction, cnps);
            payslip.AddLine("Impôt sur le revenu (IGR)", SalaryElementType.Deduction, igr);

            db.Add(payslip);
            count++;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return existingRun.Id;
    }
}
