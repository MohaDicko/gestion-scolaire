using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Finance;

namespace SchoolERP.Application.Finance.Queries.GetExpenses;

public record GetExpensesQuery() : IRequest<List<ExpenseDto>>;

public record ExpenseDto(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime DateIncurred,
    int CategoryId,
    string CategoryName,
    string? ReferenceNumber
);

public class GetExpensesQueryHandler : IRequestHandler<GetExpensesQuery, List<ExpenseDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetExpensesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ExpenseDto>> Handle(GetExpensesQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;

        var expenses = await db.Set<Expense>()
            .OrderByDescending(x => x.DateIncurred)
            .ToListAsync(cancellationToken);

        return expenses.Select(e => new ExpenseDto(
            e.Id,
            e.Description,
            e.Amount,
            e.DateIncurred,
            (int)e.Category,
            e.Category.ToString(),
            e.ReferenceNumber
        )).ToList();
    }
}
