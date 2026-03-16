using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;

namespace SchoolERP.Application.HR.Queries.GetLeaves;

public record GetLeavesQuery() : IRequest<List<LeaveDto>>;

public record LeaveDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string Department,
    string LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    int TotalDays,
    string Reason,
    string Status
);

public class GetLeavesQueryHandler : IRequestHandler<GetLeavesQuery, List<LeaveDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLeavesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<LeaveDto>> Handle(GetLeavesQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        return await db.Set<LeaveRequest>()
            .Include(l => l.Employee)
            .OrderByDescending(l => l.StartDate)
            .Select(l => new LeaveDto(
                l.Id,
                l.EmployeeId,
                l.Employee != null ? $"{l.Employee.FirstName} {l.Employee.LastName}" : "Unknown",
                l.Employee != null && l.Employee.Department != null ? l.Employee.Department.Name : "Général",
                l.LeaveType.ToString(),
                l.StartDate,
                l.EndDate,
                l.TotalDays,
                l.Reason,
                l.Status.ToString()
            ))
            .ToListAsync(cancellationToken);
    }
}
