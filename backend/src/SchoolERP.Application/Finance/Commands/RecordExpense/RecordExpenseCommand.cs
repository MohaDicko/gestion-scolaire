using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Finance;

namespace SchoolERP.Application.Finance.Commands.RecordExpense;

public record RecordExpenseCommand(
    string Description,
    decimal Amount,
    DateTime DateIncurred,
    int CategoryId,
    string? ReferenceNumber
) : IRequest<Guid>;

public class RecordExpenseCommandHandler : IRequestHandler<RecordExpenseCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public RecordExpenseCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(RecordExpenseCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.GetCurrentTenantId();

        var expense = Expense.Create(
            tenantId,
            request.Description,
            request.Amount,
            request.DateIncurred,
            (ExpenseCategory)request.CategoryId,
            request.ReferenceNumber
        );

        var db = (DbContext)_unitOfWork;
        await db.Set<Expense>().AddAsync(expense, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return expense.Id;
    }
}
