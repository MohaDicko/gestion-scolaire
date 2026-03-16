using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Finance;
using Microsoft.EntityFrameworkCore;

namespace SchoolERP.Application.Dashboard.Queries;

public record GetFinancialPerformanceQuery : IRequest<List<FinancialMonthlyDataDto>>;

public record FinancialMonthlyDataDto(string Month, decimal Revenue, decimal Expenses);

public class GetFinancialPerformanceQueryHandler : IRequestHandler<GetFinancialPerformanceQuery, List<FinancialMonthlyDataDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetFinancialPerformanceQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<FinancialMonthlyDataDto>> Handle(GetFinancialPerformanceQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var last6Months = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-i))
            .OrderBy(d => d)
            .ToList();

        var result = new List<FinancialMonthlyDataDto>();

        foreach (var date in last6Months)
        {
            var monthStart = new DateTime(date.Year, date.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var revenue = await db.Set<StudentPayment>()
                .Where(p => p.PaymentDate >= monthStart && p.PaymentDate <= monthEnd)
                .SumAsync(p => p.Amount, cancellationToken);

            var expenses = await db.Set<Expense>()
                .Where(e => e.DateIncurred >= monthStart && e.DateIncurred <= monthEnd)
                .SumAsync(e => e.Amount, cancellationToken);

            result.Add(new FinancialMonthlyDataDto(
                date.ToString("MMM yyyy"),
                revenue,
                expenses
            ));
        }

        return result;
    }
}
