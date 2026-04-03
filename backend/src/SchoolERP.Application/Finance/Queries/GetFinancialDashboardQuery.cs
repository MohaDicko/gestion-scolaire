using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Finance;

namespace SchoolERP.Application.Finance.Queries;

public record FinancialDashboardDto
{
    public decimal TotalTuitionExpected { get; init; }
    public decimal TotalCollected { get; init; }
    public decimal TotalOutStanding { get; init; }
    public decimal CollectionRate { get; init; } // Percentage
    public List<DefaulterDto> TopDefaulters { get; init; } = new();
}

public record DefaulterDto(string StudentName, string ClassName, decimal AmountDue, string ParentPhone);

public record GetFinancialDashboardQuery(Guid AcademicYearId, Guid? CampusId = null) : IRequest<FinancialDashboardDto>;

public class GetFinancialDashboardQueryHandler : IRequestHandler<GetFinancialDashboardQuery, FinancialDashboardDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetFinancialDashboardQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<FinancialDashboardDto> Handle(GetFinancialDashboardQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        var query = db.Set<StudentInvoice>()
            .Include(i => i.Student)
            .Include(i => i.Payments)
            .Where(i => i.AcademicYearId == request.AcademicYearId);

        if (request.CampusId.HasValue)
        {
            query = query.Where(i => i.Student.CampusId == request.CampusId.Value);
        }

        var invoices = await query.ToListAsync(cancellationToken);

        var totalExpected = invoices.Sum(i => i.Amount);
        var totalCollected = invoices.SelectMany(i => i.Payments).Sum(p => p.Amount);
        var totalOutstanding = totalExpected - totalCollected;

        var defaulters = invoices
            .Where(i => (i.Amount - i.Payments.Sum(p => p.Amount)) > 0)
            .Select(i => new DefaulterDto(
                i.Student?.FullName ?? "N/A",
                "N/A", // Enrollment join needed for real class name
                i.Amount - i.Payments.Sum(p => p.Amount),
                i.Student?.ParentPhone ?? ""
            ))
            .OrderByDescending(d => d.AmountDue)
            .Take(10)
            .ToList();

        return new FinancialDashboardDto
        {
            TotalTuitionExpected = totalExpected,
            TotalCollected = totalCollected,
            TotalOutStanding = totalOutstanding,
            CollectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
            TopDefaulters = defaulters
        };
    }
}
