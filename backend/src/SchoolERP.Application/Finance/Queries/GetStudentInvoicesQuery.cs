using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Finance.Queries.GetStudentInvoices;

public record InvoiceDto(
    Guid Id,
    string InvoiceNumber,
    string Description,
    decimal Amount,
    decimal RemainingAmount,
    string Status,
    DateTime DueDate);

public record GetStudentInvoicesQuery(Guid StudentId) : IRequest<List<InvoiceDto>>;

public class GetStudentInvoicesQueryHandler : IRequestHandler<GetStudentInvoicesQuery, List<InvoiceDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStudentInvoicesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<InvoiceDto>> Handle(GetStudentInvoicesQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        return await db.Set<StudentInvoice>()
            .Include(i => i.Payments)
            .Where(i => i.StudentId == request.StudentId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvoiceDto(
                i.Id,
                i.InvoiceNumber,
                i.Description,
                i.Amount,
                i.Amount - i.Payments.Sum(p => p.Amount),
                i.Status.ToString(),
                i.DueDate))
            .ToListAsync(cancellationToken);
    }
}
