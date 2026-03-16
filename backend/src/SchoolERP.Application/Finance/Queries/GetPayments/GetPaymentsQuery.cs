using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Finance;

namespace SchoolERP.Application.Finance.Queries.GetPayments;

public record GetPaymentsQuery() : IRequest<List<PaymentDto>>;

public record PaymentDto(
    Guid Id,
    string InvoiceNumber,
    string StudentName,
    decimal Amount,
    DateTime PaymentDate,
    string PaymentMethod,
    string ReferenceNumber
);

public class GetPaymentsQueryHandler : IRequestHandler<GetPaymentsQuery, List<PaymentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPaymentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PaymentDto>> Handle(GetPaymentsQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        return await db.Set<StudentPayment>()
            .Include(p => p.Invoice)
                .ThenInclude(i => i!.Student)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PaymentDto(
                p.Id,
                p.Invoice!.InvoiceNumber,
                p.Invoice.Student != null ? $"{p.Invoice.Student.FirstName} {p.Invoice.Student.LastName}" : "Unknown",
                p.Amount,
                p.PaymentDate,
                p.PaymentMethod,
                p.ReferenceNumber
            ))
            .ToListAsync(cancellationToken);
    }
}
