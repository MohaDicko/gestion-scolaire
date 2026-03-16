using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Finance.Commands.GenerateClassInvoices;

public record GenerateClassInvoicesCommand(
    Guid ClassroomId,
    Guid AcademicYearId,
    string Description,
    decimal Amount,
    FeeType FeeType,
    DateTime DueDate) : IRequest<int>;

public class GenerateClassInvoicesCommandHandler : IRequestHandler<GenerateClassInvoicesCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public GenerateClassInvoicesCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<int> Handle(GenerateClassInvoicesCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        var studentIds = await db.Set<SchoolERP.Domain.Academic.Enrollment>()
            .Where(e => e.ClassroomId == request.ClassroomId && e.Status == EnrollmentStatus.Active && e.AcademicYearId == request.AcademicYearId)
            .Select(e => e.StudentId)
            .ToListAsync(cancellationToken);

        int count = 0;
        foreach (var studentId in studentIds)
        {
            var invoice = StudentInvoice.Create(
                tenantId,
                studentId,
                request.AcademicYearId,
                request.Description,
                request.Amount,
                request.FeeType,
                request.DueDate
            );
            await db.AddAsync(invoice, cancellationToken);
            count++;
        }

        if (count > 0)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return count;
    }
}
