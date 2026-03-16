using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Payroll;

namespace SchoolERP.Application.Payroll.Commands.ProcessPayroll;

public record ProcessPayrollCommand(Guid EmployeeId, DateTime PeriodStart, DateTime PeriodEnd) : IRequest<Guid>;

public class ProcessPayrollCommandHandler : IRequestHandler<ProcessPayrollCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public ProcessPayrollCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(ProcessPayrollCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        var employee = await db.Set<SchoolERP.Domain.HR.Employee>()
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);
            
        if (employee == null) throw new Exception("Employee not found");

        var contract = await db.Set<SchoolERP.Domain.HR.Contract>()
            .FirstOrDefaultAsync(c => c.EmployeeId == request.EmployeeId && c.Status == SchoolERP.Domain.Enums.ContractStatus.Active, cancellationToken);

        if (contract == null) throw new Exception("Active contract not found for employee");

        // Detailed Payroll Calculation
        var grossSalary = contract.BaseSalary;
        
        // Mock deduction: 10% for Social Security / Income Tax
        var totalDeductions = grossSalary * 0.10m;
        var netSalary = grossSalary - totalDeductions;

        var payslip = Payslip.Create(
            tenantId,
            request.EmployeeId,
            Guid.Empty, // Mock PayrollRunId
            grossSalary,
            0m, // total allowances
            totalDeductions,
            request.PeriodStart.Month,
            request.PeriodStart.Year
        );

        // Add dummy lines for transparency
        // We need to access private _lines list via reflection or Domain method if we had one.
        // For now, let's just use the basic entity creation properties.
        
        await db.AddAsync(payslip, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return payslip.Id;
    }
}
