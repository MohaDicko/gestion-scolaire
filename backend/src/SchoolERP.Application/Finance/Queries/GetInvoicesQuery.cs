using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Finance;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.Finance.Queries.GetInvoices;

public record GetInvoicesQuery(bool OnlyWithArrears = false, Guid? CampusId = null) : IRequest<List<InvoiceDto>>;

public record InvoiceDto(
    Guid Id,
    string InvoiceNumber,
    string Description,
    decimal Amount,
    decimal RemainingAmount,
    string Status,
    DateTime DueDate,
    string StudentName
);

public class GetInvoicesQueryHandler : IRequestHandler<GetInvoicesQuery, List<InvoiceDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetInvoicesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<InvoiceDto>> Handle(GetInvoicesQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var query = db.Set<StudentInvoice>().AsNoTracking();
        if (request.CampusId.HasValue)
        {
            query = query.Where(i => i.Student.CampusId == request.CampusId.Value);
        }

        var result = await query
            .Select(i => new InvoiceDto(
                i.Id,
                i.InvoiceNumber,
                i.Description,
                i.Amount,
                i.Amount - i.Payments.Sum(p => p.Amount),
                i.Status.ToString(),
                i.DueDate,
                i.Student != null ? $"{i.Student.FirstName} {i.Student.LastName}" : "N/A"
            ))
            .ToListAsync(cancellationToken);

        if (request.OnlyWithArrears)
        {
            result = result.Where(i => i.RemainingAmount > 0).ToList();
        }

        return result;
    }
}
