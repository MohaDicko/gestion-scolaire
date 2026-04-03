using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Finance.Commands.GeneratePaymentPlan;

public record GeneratePaymentPlanCommand(
    Guid ClassroomId,
    Guid AcademicYearId,
    string BaseDescription,
    decimal TotalAmount,
    FeeType FeeType,
    int Installments,
    int IntervalDays = 30) : IRequest<int>;

public class GeneratePaymentPlanCommandHandler : IRequestHandler<GeneratePaymentPlanCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public GeneratePaymentPlanCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<int> Handle(GeneratePaymentPlanCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        var studentIds = await db.Set<SchoolERP.Domain.Academic.Enrollment>()
            .Where(e => e.ClassroomId == request.ClassroomId && e.Status == EnrollmentStatus.Active && e.AcademicYearId == request.AcademicYearId)
            .Select(e => e.StudentId)
            .ToListAsync(cancellationToken);

        int count = 0;
        decimal installmentAmount = Math.Round(request.TotalAmount / request.Installments, 2);

        foreach (var studentId in studentIds)
        {
            for (int i = 1; i <= request.Installments; i++)
            {
                var dueDate = DateTime.UtcNow.AddDays((i - 1) * request.IntervalDays);
                var description = $"{request.BaseDescription} (Échéance {i}/{request.Installments})";
                
                // Adjust last installment for rounding
                var amount = i == request.Installments 
                    ? request.TotalAmount - (installmentAmount * (request.Installments - 1))
                    : installmentAmount;

                var invoice = StudentInvoice.Create(
                    tenantId,
                    studentId,
                    request.AcademicYearId,
                    description,
                    amount,
                    request.FeeType,
                    dueDate
                );
                
                await db.AddAsync(invoice, cancellationToken);
                count++;
            }
        }

        if (count > 0)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return count;
    }
}
