using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Finance.Commands.GenerateInvoice;

public record GenerateStudentInvoiceCommand(
    Guid StudentId,
    Guid AcademicYearId,
    string Description,
    decimal Amount,
    FeeType FeeType,
    DateTime DueDate) : IRequest<Guid>;

public class GenerateStudentInvoiceCommandHandler : IRequestHandler<GenerateStudentInvoiceCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public GenerateStudentInvoiceCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(GenerateStudentInvoiceCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();

        var invoice = StudentInvoice.Create(
            tenantId,
            request.StudentId,
            request.AcademicYearId,
            request.Description,
            request.Amount,
            request.FeeType,
            request.DueDate
        );

        await db.AddAsync(invoice, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return invoice.Id;
    }
}
